import mongoose from "mongoose";

const feeReceiptSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, required: true, unique: true, trim: true },

    // Optional link to an existing Student record. Kept optional so admin
    // can also issue a receipt for someone not yet added as a student.
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },

    // Snapshot fields (kept even if the linked student is edited/deleted later,
    // so old receipts always show what was true at the time of payment)
    studentName: { type: String, required: true, trim: true },
    fatherName: { type: String, trim: true },
    mobile: { type: String, trim: true },
    studentEmail: { type: String, trim: true, lowercase: true },
    admissionNumber: { type: String, trim: true },
    course: { type: String, required: true, trim: true },
    batch: { type: String, trim: true },

    paymentMode: {
      type: String,
      enum: ["Cash", "UPI", "Bank Transfer", "Card", "Cheque", "Online"],
      default: "Cash",
    },
    transactionId: { type: String, trim: true },
    paymentDate: { type: Date, required: true, default: Date.now },

    // --- Fee breakdown ---
    courseFee: { type: Number, required: true, min: 0 },
    registrationFee: { type: Number, default: 0, min: 0 },
    studyMaterialFee: { type: Number, default: 0, min: 0 },
    otherCharges: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },

    subtotal: { type: Number, default: 0, min: 0 }, // sum of fees minus discount
    cgstPercent: { type: Number, default: 0, min: 0 },
    sgstPercent: { type: Number, default: 0, min: 0 },
    cgstAmount: { type: Number, default: 0, min: 0 },
    sgstAmount: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, default: 0, min: 0 }, // subtotal + cgst + sgst

    // --- Payment tracking against the grand total ---
    previouslyPaid: { type: Number, default: 0, min: 0 },
    amountPaid: { type: Number, required: true, min: 0 }, // amount paid on THIS receipt
    balanceDue: { type: Number, default: 0, min: 0 },

    amountInWords: { type: String, trim: true },

    remarks: { type: String, trim: true },

    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

feeReceiptSchema.index({
  receiptNumber: "text",
  studentName: "text",
  mobile: "text",
  admissionNumber: "text",
  transactionId: "text",
  course: "text",
});

export default mongoose.model("FeeReceipt", feeReceiptSchema);
