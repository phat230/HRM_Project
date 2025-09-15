import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Kết nối đến MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Kết nối MongoDB thành công!'))
    .catch(err => console.error('Lỗi kết nối MongoDB:', err));

// Middleware
app.use(express.json());
app.use(cors());

// Các route API sẽ được viết ở đây
app.get('/', (req, res) => {
    res.send('Server đang chạy!');
});

// Khởi động server
app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
});