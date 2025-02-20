import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
/*import "../index.css";*/

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Analisis = () => {
  const dataTemplate = (label, data) => ({
    labels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    datasets: [
      {
        label: label,
        data: data,
        borderColor: "purple",
        backgroundColor: "rgba(128, 0, 128, 0.1)",
      },
    ],
  });

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="analisis-container">
      <h1 className="analisis-title">Analisis</h1>

      <div className="chart-section">
        <h3 className="chart-title">Accel X</h3>
        <Line
          data={dataTemplate(
            "Accel X",
            [40, 20, 60, 10, 50, 30, 70, 20, 40, 60]
          )}
          options={options}
        />
      </div>

      <div className="chart-section">
        <h3 className="chart-title">Accel Y</h3>
        <Line
          data={dataTemplate(
            "Accel Y",
            [30, 50, 40, 60, 20, 30, 10, 40, 30, 50]
          )}
          options={options}
        />
      </div>

      <div className="chart-section">
        <h3 className="chart-title">Accel Z</h3>
        <Line
          data={dataTemplate(
            "Accel Z",
            [10, 30, 20, 40, 60, 20, 70, 60, 30, 50]
          )}
          options={options}
        />
      </div>

      <div className="chart-section">
        <h3 className="chart-title">pH</h3>
        <Line
          data={dataTemplate(
            "pH",
            [7, 6.8, 7.2, 6.9, 7.1, 6.7, 6.9, 7.0, 6.8, 7.2]
          )}
          options={options}
        />
      </div>
    </div>
  );
};

export default Analisis;
