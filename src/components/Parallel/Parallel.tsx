import React from "react";
import ParallelsStall from "../ParallelsStall/ParallelsStall";
import type { StallDiagnosticRow } from "../../types/forms";
import styles from "./Parallel.module.css";

interface ParallelsProps {
  data: StallDiagnosticRow[];
  averages: {
    avgMilkProduction: number | null;
    avgAmountWashed: number | null;
    avgReattaches: number | null;
    avgManualDetaches: number | null;
    avgManualModes: number | null;
    total_milk_production: number | null;
    total_amount_washed: number | null;
    number_reattaches: number | null;
    manual_detach_count: number | null;
    manual_mode_count: number | null;
  };
  dmb_type?: "parallel" | "herringbone";
  reverseRightColumn?: boolean;
}

const Parallels: React.FC<ParallelsProps> = ({
  data,
  averages,
  dmb_type = "parallel",
  reverseRightColumn = true,
}) => {
  const half = Math.ceil(data.length / 2);
  const column1 = data.slice(0, half);
  const column2 = data.slice(half);

  return (
    <div className={styles.container}>

        <div 
            className={styles.column}
            style={{ marginTop: dmb_type === "herringbone" ? "100px" : undefined }}
        >
            {column1.map((stall) => (
            <ParallelsStall
                key={stall.meter_address}
                data={stall}
                averages={averages}
                dmb_type={dmb_type}
                row="left"               // левый ряд
            />
            ))}
        </div>
        <div 
        className={reverseRightColumn ? styles.columnReverse : styles.column}
        style={{ marginTop: dmb_type === "herringbone" ? "100px" : undefined }}
        >
            {column2.map((stall) => (
            <ParallelsStall
                key={stall.meter_address}
                data={stall}
                averages={averages}
                dmb_type={dmb_type}
                row="right"              // правый ряд
            />
            ))}
        </div>
    </div>
  );
};

export default Parallels;

