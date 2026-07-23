import Student from "../models/Student.js";
import Certificate from "../models/Certificate.js";
import Enquiry from "../models/Enquiry.js";
import FeeReceipt from "../models/FeeReceipt.js";

export async function getDashboardStats(req, res) {
  try {
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalAdmissions,
      todaysAdmissions,
      totalEnquiries,
      totalCertificates,
      todaysCertificates,
      monthlyCertificates,
      verifiedCertificates,
      revokedCertificates,
      idCardsGenerated,
      feeAggregate,
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ createdAt: { $gte: startOfToday } }),
      Enquiry.countDocuments(),
      Certificate.countDocuments(),
      Certificate.countDocuments({ createdAt: { $gte: startOfToday } }),
      Certificate.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Certificate.countDocuments({ status: "Valid" }),
      Certificate.countDocuments({ status: "Revoked" }),
      // No dedicated ID Card generation module exists yet — this counts
      // students already marked ID-card eligible as the closest available
      // proxy until a real ID Card model/generator is built.
      Student.countDocuments({ idCardEligible: true }),
      // Fee Collection = total amount actually paid across all receipts.
      // Pending Fees = total balance still due across all receipts.
      FeeReceipt.aggregate([
        {
          $group: {
            _id: null,
            collected: { $sum: "$amountPaid" },
            pending: { $sum: "$balanceDue" },
          },
        },
      ]),
    ]);

    const feeCollection = feeAggregate[0]?.collected || 0;
    const pendingFees = feeAggregate[0]?.pending || 0;

    // Course-wise enrollments — students grouped by course (used for the
    // "Course-wise Enrollments" chart, since enrollment = admission to a course).
    const courseWise = await Student.aggregate([
      { $group: { _id: "$course", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Monthly admissions for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAdmissions = await Student.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Monthly fee collection for the last 6 months (sums amountPaid per month)
    const monthlyFeeCollection = await FeeReceipt.aggregate([
      { $match: { paymentDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$paymentDate" }, month: { $month: "$paymentDate" } },
          total: { $sum: "$amountPaid" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalAdmissions,
        todaysAdmissions,
        totalEnquiries,
        totalCertificates,
        todaysCertificates,
        monthlyCertificates,
        verifiedCertificates,
        revokedCertificates,
        idCardsGenerated,
        feeCollection,
        pendingFees,
        courseWise,
        monthlyAdmissions,
        monthlyFeeCollection,
      },
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ success: false, message: "Could not load dashboard stats." });
  }
}
