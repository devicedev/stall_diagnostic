import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useSearchParams } from "react-router-dom";
import StatisticsDashboard from "../StatisticsDashboard/StatisticsDashboard";
import styles from "./Header.module.css";

const farms = ["Наровчат", "Аршиновка", "Сердобск"];
const dmbOptions: Record<string, number[]> = {
  "Наровчат": [1, 2],
  "Аршиновка": [1, 2, 3],
  "Сердобск": [1, 2],
};
const milkingNumbers = [1, 2, 3];

export const Header: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedFarm, setSelectedFarm] = useState<string>(searchParams.get("farm") || "Наровчат");
  const [selectedDMB, setSelectedDMB] = useState<number>(
    Number(searchParams.get("dmb")) || dmbOptions[selectedFarm][0]
  );
  const [selectedDate, setSelectedDate] = useState<Date>(
    searchParams.get("date")
      ? new Date(searchParams.get("date")!)
      : new Date(new Date().setDate(new Date().getDate() - 1))
  );

  const [selectedMilking, setSelectedMilking] = useState<number>(
    Number(searchParams.get("milking")) || 1
  );

  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    if (!dmbOptions[selectedFarm].includes(selectedDMB)) {
      setSelectedDMB(dmbOptions[selectedFarm][0]);
    }
  }, [selectedFarm]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("farm", selectedFarm);
    params.set("dmb", selectedDMB.toString());
    params.set("date", selectedDate.toISOString().slice(0, 10));
    params.set("milking", selectedMilking.toString());
    setSearchParams(params);
  }, [selectedFarm, selectedDMB, selectedDate, selectedMilking]);

  useEffect(() => {
    const farmParam = searchParams.get("farm") || "Наровчат";
    const dmbParam = Number(searchParams.get("dmb")) || dmbOptions[farmParam][0];
    const dateParam = searchParams.get("date")
      ? new Date(searchParams.get("date")!)
      : new Date(new Date().setDate(new Date().getDate() - 1));
    const milkingParam = Number(searchParams.get("milking")) || 1;

    if (farmParam !== selectedFarm) setSelectedFarm(farmParam);
    if (dmbParam !== selectedDMB) setSelectedDMB(dmbParam);
    if (dateParam.getTime() !== selectedDate.getTime()) setSelectedDate(dateParam);
    if (milkingParam !== selectedMilking) setSelectedMilking(milkingParam);
  }, [searchParams]);

  return (
    <>
      <div className={styles.header}>
        <button
          className={styles.hubButton}
          onClick={() => {
            window.location.href = "/hub";
          }}
        >
          Главная
        </button>
        
        <div className={styles.selectBlock}>
          <div className={styles.field}>
            <label className={styles.label}>Дата:</label>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => {
                if (date) setSelectedDate(date);
              }}
              dateFormat="yyyy-MM-dd"
              className={styles.datepicker}
              calendarClassName={styles.calendar}
              popperPlacement="bottom-start"
              showPopperArrow={false}
              disabledKeyboardNavigation
              onChangeRaw={(e) => {
                if (e && e.preventDefault) e.preventDefault();
              }}  
              maxDate={new Date()}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Хозяйство:</label>
            <select
              value={selectedFarm}
              onChange={(e) => setSelectedFarm(e.target.value)}
              className={styles.select}
            >
              {farms.map((farm) => (
                <option key={farm} value={farm}>
                  {farm}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>ДМБ:</label>
            <select
              value={selectedDMB}
              onChange={(e) => setSelectedDMB(Number(e.target.value))}
              className={styles.select}
            >
              {dmbOptions[selectedFarm].map((dmb) => (
                <option key={dmb} value={dmb}>
                  {dmb}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Доение:</label>
            <select
              value={selectedMilking}
              onChange={(e) => setSelectedMilking(Number(e.target.value))}
              className={styles.select}
            >
              {milkingNumbers.map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Кнопка статистики - справа и центрирована по вертикали */}
        <button
          onClick={() => setShowModal(true)}
          className={styles.hubButton}
          style={{ marginLeft: "auto" }}
        >
          📈 Статистика
        </button>
      </div>

      <StatisticsDashboard
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        farm={selectedFarm}
        initialDmb={selectedDMB}
      />
    </>
  );
};
