import mongoose from "mongoose";

const headerSettingSchema = new mongoose.Schema(
  {
    header_text: {
      type: String,
      required: true,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "header_settings",
  }
);

// Ensure only one document exists
headerSettingSchema.statics.getOrCreate = async function() {
  let setting = await this.findOne();
  if (!setting) {
    setting = await this.create({ header_text: "" });
  }
  return setting;
};

const HeaderSetting = mongoose.model("HeaderSetting", headerSettingSchema);
export default HeaderSetting;

