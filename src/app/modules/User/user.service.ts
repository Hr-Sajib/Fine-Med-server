import AppError from "../../errors/AppError";
import { TUser } from "./user.interface";
import { UserModel } from "./user.model";
import bcrypt from "bcrypt"; // Make sure bcrypt is installed

const createUserIntoDB = async(payload: TUser) => {
  // Defense in depth: never trust client-supplied role/isDeleted, even if
  // some other caller path still passes them.
  const newUser = await UserModel.create({
    ...payload,
    role: 'customer',
    isDeleted: false,
  });
  if(!newUser){
    throw new AppError(400,"User not registerd! Error occured! ")
  }
  return newUser;
}



const updateUserPassword = async (
  userEmail: string,
  oldPassword: string,
  newPassword: string
) => {
  const user = await UserModel.findOne({ email: userEmail }).select("+password");
  if (!user) {
    throw new AppError(404, "User not found");
  }

  // Verify password
  const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);

  if (!isOldPasswordCorrect) {
    throw new AppError(401, "Old password is incorrect");
  }

  user.password = newPassword;
  user.passwordChangedAt = new Date();

  await user.save();

  return { message: "Password updated successfully" };
};


const getAllUsersFromDB = async () => {
  const users = await UserModel.find().select("-password"); // Exclude password field
  if (!users || users.length === 0) {
    throw new AppError(404, "No users found!");
  }
  return users;
};




const getMeFromDB = async (email: string) => {
  const user = await UserModel.findOne({ email }).select('-password');
  
  if (!user) {
    throw new AppError(404, "User not found!");
  }

  return user;
};


// New service function to update user data (name, email)
const updateUserData = async (userEmail: string, updates: Partial<TUser>) => {
  const user = await UserModel.findOne({ email: userEmail });
  if (!user) {
    throw new AppError(404, "User not found");
  }

  // Update only the provided fields (name, email)
  if (updates.name) user.name = updates.name;
  if (updates.email) user.email = updates.email;
  if (updates.phone) user.phone = updates.phone;
  if (updates.address) user.address = updates.address;


  await user.save();
  return user;
};

export const userServices = {
  createUserIntoDB,
  updateUserPassword,
  getMeFromDB,
  updateUserData,
  getAllUsersFromDB
}
