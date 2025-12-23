const mongoose = require('mongoose');
const jobsLogSchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    phone_number: {
       type: Number,
    }
  },
  {
    timestamps: true,
  }
);

jobsLogSchema.index({ job_id: 1, phone_number: 1 });


module.exports = mongoose.model('JobsLog', jobsLogSchema);
