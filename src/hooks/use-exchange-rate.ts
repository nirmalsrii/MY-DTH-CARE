import { useState, useEffect } from "react";

export function useExchangeRate() {
  const [rate, setRate] = useState(() => {
    const saved = localStorage.getItem("inrToLkrRate");
    return saved ? parseFloat(saved) : 3.6;
  });

  useEffect(() => {
    localStorage.setItem("inrToLkrRate", rate.toString());
  }, [rate]);

  return { rate, setRate };
}
