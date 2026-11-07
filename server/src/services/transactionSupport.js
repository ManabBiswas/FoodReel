import mongoose from 'mongoose';

let transactionsSupported = null;

// Returns true if the database supports transactionsSupported for MongoDB 
export const supportsTransactions = async () => {
    if (transactionsSupported !== null) return transactionsSupported;
    try {
        // https://docs.mongodb.com/manual/reference/command/hello/
        const hello = await mongoose.connection.db.admin().command({ hello: 1 });
        transactionsSupported = Boolean(hello.setName);
    } catch {
        transactionsSupported = false;
    }
    return transactionsSupported;
};

/** Test seam: forget the cached probe result. */
export const resetTransactionProbe = () => {
    transactionsSupported = null;
};
