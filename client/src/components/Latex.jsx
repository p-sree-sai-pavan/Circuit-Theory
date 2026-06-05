import { useEffect, useRef } from 'react';
import katex from 'katex';

export const Latex = ({ math }) => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (containerRef.current) {
      katex.render(math, containerRef.current, { throwOnError: false });
    }
  }, [math]);

  return <span ref={containerRef} />;
};

export default Latex;
