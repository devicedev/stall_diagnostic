import React, { useEffect } from "react";
import Carousel from "./components/Carousel/Carousel";
import { Header } from "./components/Header/Header";
import { BrowserRouter, useSearchParams } from "react-router-dom";
import type { StallDiagnosticRow } from "./types/forms";
import { fetchStallDiagnostic } from "./utils/api";
import { calculateAverages } from './utils/calculate_average';
import StallCards from "./components/StallCards/StallCards";
import styles from "./App.module.css"
import { getMetersToShow } from "./utils/meters_to_show";
import Parallels from "./components/Parallel/Parallel";

// оборачиваем в компонент, чтобы использовать хуки роутинга
const AppContent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = React.useState<StallDiagnosticRow[]>([]);
  const [averages, setAverages] = React.useState<
  { avgMilkProduction: number | null; avgAmountWashed: number | null, avgReattaches: number | null, avgManualDetaches: number | null, avgManualModes: number | null, total_milk_production: number | null, total_amount_washed: number | null, number_reattaches: number | null, manual_detach_count: number | null, manual_mode_count: number | null }>
  ({ avgMilkProduction: null, avgAmountWashed: null, avgReattaches: null, avgManualDetaches: null, avgManualModes: null, total_milk_production: null, total_amount_washed: null, number_reattaches: null, manual_detach_count: null, manual_mode_count: null });
  const [meters, setMeters] = React.useState<number[]>([]);
  const farm = searchParams.get("farm");
  const dmb = searchParams.get("dmb");
  


  useEffect(() => {
    const farm = searchParams.get("farm");
    const dmb = searchParams.get("dmb");
    const date = searchParams.get("date");
    const milking = searchParams.get("milking");

    if (!farm || !dmb || !date || !milking) return;

    fetchStallDiagnostic({
      farm,
      dmb: Number(dmb),
      date,
      milking: Number(milking),
    }).then((rows: StallDiagnosticRow[]) => {
      setData(rows);
      const avg = calculateAverages(rows);
      setAverages(avg);
              // формируем массив meter
        const metersToShow = getMetersToShow(rows, avg, "bad_empty");
        setMeters(metersToShow);

    }).catch((err) => {
      console.error("Ошибка при запросе:", err);
        setData([]);
        setAverages({ avgMilkProduction: null, avgAmountWashed: null, avgReattaches: null, avgManualDetaches: null, avgManualModes: null, total_milk_production: null, total_amount_washed: null, number_reattaches: null, manual_detach_count: null, manual_mode_count: null });
        setMeters([]);
    });
  }, [searchParams]);

  return (
    <>
      <Header />
      {data.length > 0 ? (
      <div className={styles.wrapper}>
        <div className={styles.leftPanel}>
          <StallCards data={data} meters={meters} averages={averages} setMeters={setMeters}/>
        </div>
        <div className={styles.rightPanel}>
          {data.length > 0 && averages.avgMilkProduction !== null && averages.avgAmountWashed !== null && (
            <>
              {farm === "Аршиновка" && dmb === "3" ? (
                <Parallels data={data} averages={averages} dmb_type="herringbone" />
              ) : (
                // остальные случаи, где нужен parallel или Carousel
                ((farm === "Аршиновка" && (dmb === "2")) || (farm === "Наровчат" && dmb === "2")) ? (
                  <Parallels data={data} averages={averages} dmb_type="parallel" reverseRightColumn={!(farm === "Аршиновка" && dmb === "2")} />
                ) : (
                  <Carousel data={data} averages={averages} />
                )
              )}
            </>
          )}
        </div>
      </div>
      ) : (
      <p className={styles.noData}>Нет данных для выбранных параметров</p>
      )}
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
