import express from 'express';
import apiRouter, { setPaymentProjection, setValidationGate } from './src/routes.js';
import { readDB } from './src/db.js';
import { createPaymentService } from './src/payment/service.js';
import { createValidationService } from './src/validation/service.js';
const app=express();
const payments=createPaymentService({readSource:readDB});
setPaymentProjection(payments.projectContract);
const validation=createValidationService({readSource:readDB,readPayments:()=>{payments.sync();return payments.store.read();}});
setValidationGate(validation.gateForDesign);
app.use(express.json({limit:'1600kb'}));
app.use('/api/payments',payments.router);
app.use('/api/validation',validation.router);
app.use('/api',apiRouter);
app.use((err,_req,res,_next)=>res.status(err.status||500).json({error:err.status===413?'Upload too large. Maximum file size is 1 MB.':'Request could not be processed.'}));
const port=process.env.PORT||4001;
const server=app.listen(port,'127.0.0.1',()=>console.log(`Vyavsay listening at http://127.0.0.1:${port} (local seed-connected payment demo)`));
function shutdown(){server.close(()=>{payments.close();validation.close();process.exit(0);});}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
