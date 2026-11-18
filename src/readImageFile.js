export function readImageFile(file){
  if(!file)return Promise.resolve('');
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))return Promise.reject(new Error('Please use a JPG, PNG or WebP image.'));
  if(file.size>1200000)return Promise.reject(new Error('Please choose an image smaller than 1.2 MB.'));
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||''));
    reader.onerror=()=>reject(new Error('That image could not be read.'));
    reader.readAsDataURL(file);
  });
}
