import { validationResult } from "express-validator";
import ClientRecord from "../models/ClientRecord.js";

// GET /api/admin/clients?search=&status=&technology=&page=1&limit=10
export async function listClients(req, res) {
  try {
    const {
      search = "",
      status,
      technology,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (technology) filter.technology = technology;
    if (search) filter.$text = { $search: search };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const [clients, total] = await Promise.all([
      ClientRecord.find(filter)
        .populate("certificateRef", "certificateNumber status")
        .sort({ [sortBy]: order === "asc" ? 1 : -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      ClientRecord.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: clients,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    console.error("List clients error:", err);
    res.status(500).json({ success: false, message: "Could not fetch client records." });
  }
}

export async function getClient(req, res) {
  try {
    const client = await ClientRecord.findById(req.params.id).populate(
      "certificateRef",
      "certificateNumber status"
    );
    if (!client) return res.status(404).json({ success: false, message: "Client record not found." });
    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not fetch client record." });
  }
}

export async function createClient(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.logo = `/uploads/clients/${req.file.filename}`;
    }

    const client = await ClientRecord.create(payload);
    res.status(201).json({ success: true, data: client });
  } catch (err) {
    console.error("Create client error:", err);
    res.status(500).json({ success: false, message: "Could not create client record." });
  }
}

export async function updateClient(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.logo = `/uploads/clients/${req.file.filename}`;
    }

    const client = await ClientRecord.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!client) return res.status(404).json({ success: false, message: "Client record not found." });
    res.json({ success: true, data: client });
  } catch (err) {
    console.error("Update client error:", err);
    res.status(500).json({ success: false, message: "Could not update client record." });
  }
}

export async function deleteClient(req, res) {
  try {
    const client = await ClientRecord.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: "Client record not found." });
    res.json({ success: true, message: "Client record deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not delete client record." });
  }
}
