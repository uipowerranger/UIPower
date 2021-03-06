const adminSchema = require("../Models/admin");
var utilsinfo = require("../../utils/util");
const categorySchema = require("../Models/productCategory");
const subCategorySchema = require("../Models/productSubCategory");
const productsSchema = require("../Models/product");
var ObjectId = require("mongodb").ObjectId;
const accountSid = "AC4be7b5b92540e1b4106f98110175a683";
const authToken = "518a15d6007c1f542dc43d1ec45c56ac";
const fromUser = "+17330843533";
const client = require("twilio")(accountSid, authToken);

//getLoginUser
exports.getLoginUser = async (req) => {
  const { _id } = req.body;
  let admin = await adminSchema.find({ _id: _id });
  if (admin.length > 0) {
    return [false, admin];
  } else {
    return [true, []];
  }
};

exports.updateAdmin = async (req) => {
  const { _id, ...rest } = req.body;
  let admin = await adminSchema.updateOne({ _id: _id }, { $set: { ...rest } });
  return [false, admin];
};

//Admin Register
exports.register = async (req) => {
  const request = req.body;
  let params = {};
  if (request.email_id && request.password) {
    try {
      params.first_name = request.first_name;
      params.last_name = request.last_name;
      params.password = request.password;
      params.phone_number = request.phone_number;
      params.image = "";
      params.email_id = request.email_id;
      params.is_active = 1;
      params.login_otp = "";
      params.designation = "";
      params.address = "";
      params.city = "";
      params.state = "";
      params.post_code = "";
      params.created_at = utilsinfo.getCurrentUTCTimestamp();
      let admin = new adminSchema(params);
      let result = await admin.save();
      return [false, result];
    } catch (e) {
      return [true, [], "Duplicate email id or phone number"];
    }
  } else {
    return [true, []];
  }
};

//Admin Login
exports.login = async (req) => {
  const { username, password } = req.body;
  let admin = await adminSchema.find({
    email_id: username,
    password: password,
  });
  if (admin.length > 0) {
    const randomotp = utilsinfo.getVerificationCode();
    try {
      await client.messages.create({
        body: `${randomotp} is your Verifcation Code`,
        from: fromUser,
        to: admin[0].phone_number,
      });
      await adminSchema.updateOne(
        { _id: admin[0]._id },
        { $set: { login_otp: randomotp } }
      );
      return [false, admin];
    } catch (e) {
      return [true, [], "Unable to sent OTP to phone number"];
    }
  } else {
    return [true, [], "Invalid Login"];
  }
};

//Admin Login
exports.verifyOtp = async (req) => {
  const { _id, login_otp } = req.body;
  let admin = await adminSchema.find({
    _id: _id,
    login_otp: login_otp,
  });
  if (admin.length > 0) {
    return [false, admin];
  } else {
    return [true, []];
  }
};

//create category
exports.createCategory = async (req) => {
  const request = req.body;
  let params = {};
  if (
    request.category_name &&
    request.is_active &&
    request.category_name != ""
  ) {
    params.category_name = request.category_name;
    params.is_active = request.is_active;
    params.created_at = utilsinfo.getCurrentUTCTimestamp();
    let newCategory = new categorySchema(params);
    let result = await newCategory.save();
    return [false, result];
  } else {
    return [true, []];
  }
};

// get all categories
exports.getAllCategory = async () => {
  let category = await categorySchema.find();
  return [false, category];
};

// get all subCategories
exports.getAllSubCategory = async (req) => {
  let subCategory = await subCategorySchema.aggregate([
    {
      $lookup: {
        from: "categories",
        localField: "category_details",
        foreignField: "_id",
        as: "category",
      },
    },
  ]);
  return [false, subCategory];
};

// get all subCategories
exports.getAllSubCategorybyCategory = async (req) => {
  let subCategory = await subCategorySchema.aggregate([
    {
      $lookup: {
        from: "categories",
        localField: "category_details",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $match: {
        category_details: !!req.body.category
          ? ObjectId(req.body.category)
          : "",
      },
    },
  ]);
  return [false, subCategory];
};

// get all categories
exports.updateCategory = async (req) => {
  const { _id, ...rest } = req.body;
  let category = await categorySchema.updateOne(
    { _id: _id },
    { $set: { ...rest } }
  );
  return [false, category];
};

// get all updateSubCategories
exports.updateSubCategory = async (req) => {
  const { _id, ...rest } = req.body;
  let subCategory = await subCategorySchema.updateOne(
    { _id: _id },
    { $set: { ...rest } }
  );
  return [false, subCategory];
};

// get all delete categories
exports.deleteCategory = async (req) => {
  let category = await categorySchema
    .find({ _id: req.body.id })
    .remove()
    .exec();
  return [false];
};

// get all dekete sub category
exports.deleteSubCategory = async (req) => {
  let subcategory = await subCategorySchema.find({ _id: req.body.id }).remove();
  return [false];
};

//create subCategory
exports.createSubCategory = async (req) => {
  const request = req.body;
  let params = {};
  if (request.category_details && request.sub_category_name) {
    params.category_details = request.category_details;
    params.sub_category_name = request.sub_category_name;
    params.is_active = 1;
    params.created_at = utilsinfo.getCurrentUTCTimestamp();
    let newSubCategory = await new subCategorySchema(params);
    let result = await newSubCategory.save();
    return [false, result];
  } else {
    return [true, []];
  }
};

//create Product
exports.createProduct = async (req) => {
  const { _id, ...request } = req.body;
  let params = {};
  // if (request.is_new_category === 1) {
  //   let [err, newCategory] = await this.createCategory(req);
  //   if (err) {
  //     return [true, []];
  //   }
  //   req.body.category_id = newCategory._id;
  //   let [errSub, newSubCategory] = await this.createSubCategory(req);
  //   request.category_id = newCategory._id;
  //   request.sub_category_id = newSubCategory._id;
  // }
  if (request.category_details && request.sub_category_details) {
    params = { ...request };
    params.created_at = utilsinfo.getCurrentUTCTimestamp();
    params.offer_from_date = utilsinfo.getTimestamp(req.body.offer_from_date);
    params.offer_to_date = utilsinfo.getTimestamp(req.body.offer_to_date);
    let newProduct = await new productsSchema(params);
    let result = await newProduct.save();
    return [false, result];
  } else {
    return [true, []];
  }
};

//update product
exports.updateProduct = async (req) => {
  const { _id, ...request } = req.body;
  let params = { ...request };
  if (params.created_at) {
    params.offer_from_date = utilsinfo.getTimestamp(params.offer_from_date);
    params.offer_to_date = utilsinfo.getTimestamp(params.offer_to_date);
    params.created_at = utilsinfo.getTimestamp(params.created_at);
  }
  let result = await productsSchema.updateOne({ _id: _id }, { $set: params });
  return [false, result];
};

//get metadata create product
exports.getMetaDataCreateProduct = async (req) => {
  let products = await productsSchema.aggregate([
    {
      $lookup: {
        from: "categories",
        localField: "category_details",
        foreignField: "_id",
        as: "category_detail",
      },
    },
    {
      $lookup: {
        from: "sub_categories",
        localField: "sub_category_details",
        foreignField: "_id",
        as: "sub_category_detail",
      },
    },
  ]);
  return [false, products];
};

//get all products
exports.getAllProducts = async (req) => {
  let products = await productsSchema.aggregate([
    {
      $lookup: {
        from: "categories",
        localField: "category_details",
        foreignField: "_id",
        as: "category_detail",
      },
    },
    {
      $lookup: {
        from: "sub_categories",
        localField: "sub_category_details",
        foreignField: "_id",
        as: "sub_category_detail",
      },
    },
  ]);
  return [false, products];
};

//get products by pincode
exports.getProductsByPincode = async (req) => {
  let products = await productsSchema.find({
    post_code_details: req.body.post_code_details,
  });
  return [false, products];
};

exports.filterProductby = async (req) => {
  let products = await productsSchema.find({
    ...req.body.filters,
    // post_code_details: req.body.post_code_details,
  });
  return [false, products];
};
