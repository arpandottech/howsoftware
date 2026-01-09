const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Studio = require('./src/models/Studio');

dotenv.config({ path: './.env' }); // Adjust path if needed

const checkStudios = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const count = await Studio.countDocuments();
        console.log(`Total Studios: ${count}`);

        const studios = await Studio.find({});
        console.log("Studios:", studios);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkStudios();
