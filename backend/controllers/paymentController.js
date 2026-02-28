// controllers/paymentController.js — Real Razorpay Integration
const Razorpay     = require("razorpay");
const crypto       = require("crypto");
const Project      = require("../models/Project");
const Contribution = require("../models/Contribution");
const { supabaseAdmin } = require("../config/db");
const { sendSuccess, sendError } = require("../utils/response");

// Initialise Razorpay (lazy — only when keys exist)
let razorpay = null;
const getRazorpay = () => {
  if (razorpay) return razorpay;
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || keyId.includes("XXXX") || keySecret.includes("your_")) {
    return null;
  }
  razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return razorpay;
};

// POST /api/payments/create-order
const createOrder = async (req, res) => {
  try {
    const { projectId, amount } = req.body;

    if (!projectId)
      return sendError(res, "projectId is required.", 400);
    if (!amount || isNaN(amount) || Number(amount) < 1)
      return sendError(res, "Minimum contribution is ₹1.", 400);

    // Lightweight project lookup
    const { data: project, error: projError } = await supabaseAdmin
      .from("projects")
      .select("id, title, status, deadline, goal_amount, amount_raised")
      .eq("id", projectId)
      .single();

    if (projError || !project)
      return sendError(res, "Project not found.", 404);

    if (new Date(project.deadline) < new Date())
      return sendError(res, "This project's campaign has ended.", 400);

    const rz = getRazorpay();

    if (!rz) {
      // Fallback to mock if Razorpay keys not set
      console.warn("[Payment] Razorpay keys not configured — using mock order");
      return sendSuccess(res, {
        orderId:      `mock_order_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        amount:       Math.round(Number(amount) * 100),
        currency:     "INR",
        keyId:        null,   // tells frontend to skip Razorpay popup
        projectTitle: project.title,
        userName:     req.user?.name  || "Backer",
        userEmail:    req.user?.email || "",
        mock:         true,
      });
    }

    // Create real Razorpay order
    const order = await rz.orders.create({
      amount:   Math.round(Number(amount) * 100), // paise
      currency: "INR",
      receipt:  `rcpt_${Date.now()}`,
      notes:    { projectId, projectTitle: project.title, userId: req.user.id },
    });

    return sendSuccess(res, {
      orderId:      order.id,
      amount:       order.amount,
      currency:     order.currency,
      keyId:        process.env.RAZORPAY_KEY_ID,
      projectTitle: project.title,
      userName:     req.user?.name  || "Backer",
      userEmail:    req.user?.email || "",
      mock:         false,
    });

  } catch (err) {
    console.error("[Payment] createOrder error:", err.message);
    return sendError(res, `Payment order failed: ${err.message}`, 500);
  }
};

// POST /api/payments/verify
const verifyPayment = async (req, res) => {
  try {
    const {
      projectId, rewardId, amount, amountINR, message, anonymous,
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      mock_order_id,
    } = req.body;

    if (!projectId || (!amount && !amountINR))
      return sendError(res, "projectId and amount are required.", 400);

    const isMock = !!mock_order_id || !razorpay_payment_id;
    let finalPaymentId = razorpay_payment_id;
    let finalOrderId   = razorpay_order_id || mock_order_id;

    if (!isMock) {
      // Verify Razorpay signature
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (keySecret && !keySecret.includes("your_")) {
        const expected = crypto
          .createHmac("sha256", keySecret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest("hex");
        if (expected !== razorpay_signature) {
          console.error("[Payment] Signature mismatch");
          return sendError(res, "Payment verification failed — invalid signature.", 400);
        }
      }
    } else {
      finalPaymentId = `mock_pay_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    }

    // Amount is in paise from Razorpay, convert to rupees for DB
    // amountINR is sent directly as backup
    const finalAmountINR = amountINR
      ? Number(amountINR)
      : Math.round(Number(amount) / 100);
    console.log(`[Payment] verify — projectId:${projectId} paise:${amount} inr:${finalAmountINR}`);

    let contribution = null;
    try {
      contribution = await Contribution.processPayment({
        backer_id:           req.user.id,
        project_id:          projectId,
        reward_id:           rewardId || null,
        amount:              finalAmountINR,
        razorpay_order_id:   finalOrderId   || `order_${Date.now()}`,
        razorpay_payment_id: finalPaymentId || `pay_${Date.now()}`,
        message:             message  || "",
        anonymous:           anonymous === true || anonymous === "true",
      });
    } catch (dbErr) {
      console.error("[Payment] DB write failed:", dbErr.message);
      return sendSuccess(res, {
        contribution: null,
        payment_id:   finalPaymentId,
        warning:      "Payment successful but DB record failed.",
      });
    }

    // Update milestones (silent fail)
    try { await Project.checkMilestones(projectId); } catch {}

    return sendSuccess(res, { contribution, payment_id: finalPaymentId });

  } catch (err) {
    console.error("[Payment] verifyPayment error:", err.message);
    return sendError(res, `Verification failed: ${err.message}`, 500);
  }
};

// GET /api/payments/contribution/:paymentId
const getContribution = async (req, res) => {
  try {
    const contribution = await Contribution.findByPaymentId(req.params.paymentId);
    if (!contribution) return sendError(res, "Contribution not found.", 404);
    return sendSuccess(res, { contribution });
  } catch (err) {
    return sendError(res, err.message);
  }
};

// GET /api/payments/my-contributions
const getMyContributions = async (req, res) => {
  try {
    return sendSuccess(res, {
      contributions: await Contribution.findByBacker(req.user.id),
    });
  } catch (err) {
    return sendError(res, err.message);
  }
};

module.exports = { createOrder, verifyPayment, getContribution, getMyContributions };
