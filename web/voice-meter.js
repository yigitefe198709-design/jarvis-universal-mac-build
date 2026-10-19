// Playback amplitude animation, not phoneme-level lip sync.
export function rmsFromBytes(samples){
 if(!samples?.length)return 0;
 let sum=0;for(const value of samples){const n=(value-128)/128;sum+=n*n;}
 return Math.min(1,Math.sqrt(sum/samples.length)*4);
}
export function createVoiceMeter(stream,onLevel,{AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext,raf=globalThis.requestAnimationFrame,caf=globalThis.cancelAnimationFrame}={}){
 if(!AudioContextClass||!raf||!caf)throw Error('Web Audio not supported');
 const ctx=new AudioContextClass();
 const source=ctx.createMediaStreamSource(stream);
 const analyser=ctx.createAnalyser();analyser.fftSize=1024;
 source.connect(analyser); // Do NOT connect to destination: audio element already plays sound.
 const data=new Uint8Array(analyser.fftSize);
 let active=true,frame=null;
 const tick=()=>{if(!active)return;analyser.getByteTimeDomainData(data);onLevel(rmsFromBytes(data));frame=raf(tick);};
 frame=raf(tick);
 return {stop(){if(!active)return;active=false;if(frame!==null)caf(frame);source.disconnect();analyser.disconnect();void ctx.close();onLevel(0);}};
}
