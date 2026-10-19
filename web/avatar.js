// Visual avatar state controller. No biometric tracking or camera access.
export const STATES = Object.freeze(['idle','listening','thinking','speaking','error']);
export function normalizedLevel(samples) {
  if (!samples?.length) return 0;
  let sum=0;
  for(const x of samples){const v=(Number(x)-128)/128;sum+=v*v;}
  return Math.min(1,Math.sqrt(sum/samples.length)*3);
}
export function createAvatar(element, label){
  let state='idle';
  const setState=next=>{
    if(!STATES.includes(next))throw new Error('Unknown avatar state');
    state=next;element.dataset.state=next;
    if(label)label.textContent={idle:'Hazır',listening:'Dinliyorum',thinking:'Düşünüyorum',speaking:'Konuşuyorum',error:'Bağlantı hatası'}[next];
  };
  const setLevel=level=>element.style.setProperty('--voice-level',String(Math.max(0,Math.min(1,Number(level)||0))));
  setState('idle');setLevel(0);
  return {setState,setLevel,getState:()=>state};
}
