// node dummy_services.js setup|remove — DUMMY event-service vendors for testing on the live DB.
// All tagged firebaseUid 'dummysvc-*' so 'remove' (run before public launch) deletes every trace.
const path=require('path');const BK=process.cwd();
require(path.join(BK,'node_modules/dotenv')).config({path:path.join(BK,'.env'),quiet:true});
const m=require(path.join(BK,'node_modules/mongoose'));
const V=[
 {key:'p1',serviceCategory:'priest',businessName:'Sri Venkateswara Purohit Seva',area:'Ameerpet',traditions:['Hindu'],languages:['Telugu','Sanskrit','Hindi'],experienceYears:22,serviceAbout:'Telugu weddings, griha pravesham, Satyanarayana vratam, upanayanam and all family ceremonies.',serviceAreas:['Ameerpet','SR Nagar','Kukatpally','Begumpet'],
  offers:[['Griha pravesham','from',5100,'Pooja samagri list shared a week before.'],['Wedding ceremony (full)','from',15000,'Muhurtham to talambralu, with assistant.'],['Satyanarayana vratam','from',2500,'']]},
 {key:'p2',serviceCategory:'priest',businessName:'Hyderabad Nikah Services',area:'Tolichowki',traditions:['Muslim'],languages:['Urdu','Hindi','Telugu'],experienceYears:15,serviceAbout:'Qazi services for nikah and related ceremonies across Hyderabad.',serviceAreas:['Tolichowki','Mehdipatnam','Charminar'],
  offers:[['Nikah ceremony','fixed',5000,'Including nikahnama paperwork.']]},
 {key:'c1',serviceCategory:'catering',businessName:'Annapurna Wedding Caterers',area:'Dilsukhnagar',traditions:[],languages:['Telugu','Hindi'],experienceYears:12,serviceAbout:'Veg and non-veg menus for 100 to 2,000 guests. Serving staff included.',serviceAreas:['Dilsukhnagar','LB Nagar','Uppal'],
  offers:[['Veg wedding menu','perPlate',350,'2 sweets, 3 curries, biryani, curd rice, papad.'],['Non-veg wedding menu','perPlate',550,'Chicken biryani, mutton curry, 2 sweets.']]},
 {key:'c2',serviceCategory:'catering',businessName:'Paradise Function Caterers',area:'Kukatpally',traditions:[],languages:['Telugu','Urdu','English'],experienceYears:8,serviceAbout:'Birthday parties, receptions and corporate lunches.',serviceAreas:['Kukatpally','Miyapur','KPHB'],
  offers:[['Party snacks + dinner','perPlate',299,'']]},
 {key:'d1',serviceCategory:'decor',businessName:'Sri Sai Flower Decorators',area:'Kukatpally',traditions:['Hindu'],languages:['Telugu','Hindi'],experienceYears:10,serviceAbout:'Stage, mandap and entrance decoration with fresh flowers.',serviceAreas:['Kukatpally','Miyapur','Ameerpet'],
  offers:[['Stage flower decoration','from',15000,'Fresh flowers, lighting, backdrop.'],['Mandap decoration','from',25000,'']]},
 {key:'d2',serviceCategory:'decor',businessName:'Royal Balloon & Theme Decor',area:'Secunderabad',traditions:[],languages:['English','Hindi','Telugu'],experienceYears:6,serviceAbout:'Birthday and baby-shower themes, balloon arches and photo booths.',serviceAreas:['Secunderabad','Bowenpally','Begumpet'],
  offers:[['Birthday theme decor','from',6000,'Balloon arch, backdrop, table setup.']]},
 {key:'m1',serviceCategory:'music',businessName:'Mangala Vadyam Sannayi Melam',area:'Warangal Highway',traditions:['Hindu'],languages:['Telugu'],experienceYears:25,serviceAbout:'Traditional sannayi and dolu for muhurtham and processions.',serviceAreas:['Uppal','LB Nagar','Dilsukhnagar'],
  offers:[['Sannayi melam (muhurtham)','fixed',8000,'Up to 3 hours, 4 artists.']]},
 {key:'m2',serviceCategory:'music',businessName:'Beat Drop DJ & Sound',area:'Gachibowli',traditions:[],languages:['English','Hindi','Telugu'],experienceYears:5,serviceAbout:'DJ with sound and lights for sangeet, receptions and parties.',serviceAreas:['Gachibowli','Madhapur','Kondapur'],
  offers:[['DJ night (4 hours)','from',12000,'Sound, lights and DJ.']]},
];
m.connect(process.env.MONGO_URI).then(async()=>{
 const P=require(path.join(BK,'models/Partner'));const O=require(path.join(BK,'models/ServiceOffer'));const R=require(path.join(BK,'models/ServiceRequest'));
 if(process.argv[2]==='setup'){
  if(await P.countDocuments({firebaseUid:/^dummysvc-/}))throw new Error('dummy services already exist');
  for(const v of V){
   const {key,offers,...f}=v;
   const p=await P.create({firebaseUid:'dummysvc-'+key,role:'service',registered:true,verificationStatus:'verified',city:'Hyderabad',ownerName:'Dummy',...f});
   await O.create(offers.map(([title,priceType,price,description])=>({partner:p._id,title,priceType,price,description})));
  }
  console.log('created',V.length,'dummy service vendors');
 } else if(process.argv[2]==='remove'){
  const ids=(await P.find({firebaseUid:/^dummysvc-/})).map(p=>p._id);
  console.log('requests',(await R.deleteMany({partner:{$in:ids}})).deletedCount,'offers',(await O.deleteMany({partner:{$in:ids}})).deletedCount,'vendors',(await P.deleteMany({_id:{$in:ids}})).deletedCount);
 }
 process.exit()}).catch(e=>{console.error(e.message);process.exit(1)});
