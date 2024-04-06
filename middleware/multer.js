// const multer = require('multer')

// const storage = multer.diskStorage({
//     destination:(req,file,cb)=>{
//         cb(null, './uploads')
//     },
//     filename:(req,file,cb)=>{
//         cb(null, file.originalname)
//     }
// })
// //Date().toLocaleDateString()+ '-' + file.originalname
// const fileFilter = (req,file,cb)=>{
//     if(file.mimetype ==='image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png'){
//         cb(null, true)
//     }else{
//         cb({message:"Unsupported file format"}, false)
//     }     
// }

// const mediaUpload = multer({
//     storage:storage,
//     limits:{fileSize:1024*1024*2},
//     fileFilter
// })


// module.exports= mediaUpload


