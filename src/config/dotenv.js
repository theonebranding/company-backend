import dotenv from 'dotenv';

const loadEnv = () => {
    dotenv.config();    

    if (!process.env.MONGO_URL || !process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
        console.error('Environment variables missing');
        process.exit(1);
    }
};

export default loadEnv;
