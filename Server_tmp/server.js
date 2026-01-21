import app from './src/app.js';
import connectDB from './src/db/db.js';
import 'dotenv/config';
const port = process.env.PORT || 3000

connectDB();
// console.log(process.env.JWT_SECRET);

app.get('/', (req, res) => {
    res.send('Hi');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});