import mongoose from 'mongoose';

const jobOrderSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    jobOrderNo: { type: Number, required: true, unique: true },
    date: { type: Date, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobNature: { type: String, required: true },
    actualSize: String,
    printingSize: String,
    numberOfCopies: { type: Number, default: 1 },
    inkColour: String,
    printingQty: Number,
    qtyRequired: { type: Number, required: true },
    kindOfPaper: String,
    paperSize: String,
    options: {
      lamination: { type: Boolean, default: false },
      rope: { type: Boolean, default: false },
      oneSide: { type: Boolean, default: false },
      twoSide: { type: Boolean, default: false },
      digital: { type: Boolean, default: false },
      size50x70: { type: Boolean, default: false },
      size100x70: { type: Boolean, default: false },
    },
    copies: {
      c1: String,
      c2: String,
      c3: String,
      c4: String,
      c5: String,
      c6: String,
    },
    numberingFrom: String,
    perforating: String,
    gumming: String,
    stitching: String,
    coverNo: String,
    coverColour: String,
    goldStamping: String,
    embossing: String,
    silkScreen: String,
    uv: String,
    dieCut: String,
    creasing: String,
    remarks: String,
    materials: [{ name: String, qty: Number, unit: String }],
    status: { type: String, enum: ['new', 'in_press', 'done'], default: 'new' },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  },
  { timestamps: true }
);

jobOrderSchema.index({ status: 1, date: -1 });
jobOrderSchema.index({ customer: 1 });

export const JobOrder = mongoose.model('JobOrder', jobOrderSchema);
