// Short synthesized sounds; no recordings from the original games.
export function createMoveSound() {
  let context, nodes=[], timer;
  function stop(){clearTimeout(timer);for(const node of nodes){try{node.stop?.();node.disconnect();}catch{}}nodes=[];}
  function play(motion){
    stop();const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;
    try {
      context??=new Audio();const ready=context.resume();ready?.catch(()=>{});
      const at=context.currentTime+.08;
      const gain=context.createGain();gain.connect(context.destination);nodes.push(gain);
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.045,at+.4);gain.gain.setValueAtTime(.045,at+1.3);gain.gain.exponentialRampToValueAtTime(.001,at+2.5);
      const osc=context.createOscillator();osc.type=['psychic','ball','heal','shield'].includes(motion)?'sine':'triangle';
      osc.frequency.setValueAtTime(motion==='bolt'?180:100,at);osc.frequency.exponentialRampToValueAtTime(motion==='psychic'?750:360,at+.65);osc.frequency.exponentialRampToValueAtTime(motion==='bolt'?70:95,at+1.8);osc.connect(gain);osc.start(at);osc.stop(at+2.5);nodes.push(osc);
      if(!['heal','shield','status','transform'].includes(motion)){
        const buffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate),data=buffer.getChannelData(0);
        for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.65;
        const source=context.createBufferSource();source.buffer=buffer;
        const filter=context.createBiquadFilter();filter.type=motion==='flame'?'lowpass':'bandpass';filter.frequency.setValueAtTime(motion==='bolt'?2400:900,at+.6);filter.frequency.exponentialRampToValueAtTime(180,at+2.3);filter.Q.value=motion==='psychic'?7:1;
        const burst=context.createGain();burst.gain.setValueAtTime(.001,at);burst.gain.setValueAtTime(.001,at+.6);burst.gain.linearRampToValueAtTime(motion==='fang'?.12:.07,at+(motion==='fang'?1.28:.85));burst.gain.exponentialRampToValueAtTime(.001,at+2.4);
        source.connect(filter);filter.connect(burst);burst.connect(context.destination);source.start(at+.6);source.stop(at+2.45);nodes.push(source,filter,burst);
      }
      timer=setTimeout(stop,2900);
    }catch{stop();} // Visuals remain available when a browser disables audio.
  }
  return {play,stop};
}
