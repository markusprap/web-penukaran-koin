import app from '../../server/app';

export const config = {
    api: {
        bodyParser: false,
        externalResolver: true,
    },
};

export default app;
