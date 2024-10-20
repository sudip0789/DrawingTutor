import React, { useEffect, useRef } from 'react';
import SiriWave from 'siriwave';

const SiriWaveComponent: React.FC = () => {
  const siriWaveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (siriWaveRef.current) {
      const siriWave = new SiriWave({
        container: siriWaveRef.current,
        style: 'ios9',
        speed: 0.1,
        amplitude: 1,
        autostart: true,
      });

      return () => {
        siriWave.dispose();
      };
    }
  }, []);

  return <div ref={siriWaveRef} style={{ width: '100%', height: '200px' }}></div>;
};

export default SiriWaveComponent;
