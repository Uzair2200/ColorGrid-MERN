import mongoose, { model } from "mongoose";

const userSignupSchema = new mongoose.Schema({
    PlayerName: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    coins: {
        type: Number,
        required: true,
        default: 1000
    },
    profilePictureUrl: {
        type: String,
        default: "https://th.bing.com/th/id/OIP.eMLmzmhAqRMxUZad3zXE5QHaHa?rs=1&pid=ImgDetMain"
    },
    wins: {
        type: Number,
        default: 0
    },
    losses: {
        type: Number,
        default: 0
    },
    draws: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export default mongoose.model('SignupSchema', userSignupSchema);