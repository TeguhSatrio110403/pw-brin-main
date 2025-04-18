import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Pagination } from "react-bootstrap";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Feeds = () => {
  // Helper functions
  const ensureArray = (value) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [];
  };

  const safeParseFloat = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Initial state with localStorage fallback
  const [sensorData, setSensorData] = useState(() => {
    try {
      const savedData = localStorage.getItem("sensorData");
      const parsedData = savedData ? JSON.parse(savedData) : {};
      
      return {
        accel_x: ensureArray(parsedData.accel_x),
        accel_y: ensureArray(parsedData.accel_y),
        accel_z: ensureArray(parsedData.accel_z),
        ph: ensureArray(parsedData.ph),
        temperature: ensureArray(parsedData.temperature),
        turbidity: ensureArray(parsedData.turbidity),
        speed: ensureArray(parsedData.speed),
        timestamps: ensureArray(parsedData.timestamps),
        lastTimestamp: parsedData.lastTimestamp || null,
      };
    } catch (error) {
      console.error("Error parsing sensorData from localStorage:", error);
      return {
        accel_x: [],
        accel_y: [],
        accel_z: [],
        ph: [],
        temperature: [],
        turbidity: [],
        speed: [],
        timestamps: [],
        lastTimestamp: null,
      };
    }
  });

  const [currentPages, setCurrentPages] = useState(() => {
    try {
      const savedPages = localStorage.getItem("currentPages");
      const parsedPages = savedPages ? JSON.parse(savedPages) : {};
      
      return {
        accel_x: parsedPages.accel_x || 1,
        accel_y: parsedPages.accel_y || 1,
        accel_z: parsedPages.accel_z || 1,
        ph: parsedPages.ph || 1,
        temperature: parsedPages.temperature || 1,
        turbidity: parsedPages.turbidity || 1,
        speed: parsedPages.speed || 1,
      };
    } catch (error) {
      console.error("Error parsing currentPages from localStorage:", error);
      return {
        accel_x: 1,
        accel_y: 1,
        accel_z: 1,
        ph: 1,
        temperature: 1,
        turbidity: 1,
        speed: 1,
      };
    }
  });

  const dataPerPage = 10;

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("sensorData", JSON.stringify(sensorData));
  }, [sensorData]);

  useEffect(() => {
    localStorage.setItem("currentPages", JSON.stringify(currentPages));
  }, [currentPages]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://server-water-sensors-production.up.railway.app/getCurrentData",
          {
            headers: {
              "Last-Timestamp": sensorData.lastTimestamp || "0",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const result = await response.json();

        if (
          result.success &&
          result.data &&
          result.data.message &&
          (!sensorData.lastTimestamp || result.data.timestamp > sensorData.lastTimestamp)
        ) {
          const timestamp = new Date(result.data.timestamp).toLocaleTimeString();

          setSensorData((prevData) => ({
            ...prevData,
            accel_x: [...prevData.accel_x, safeParseFloat(result.data.message.accel_x)],
            accel_y: [...prevData.accel_y, safeParseFloat(result.data.message.accel_y)],
            accel_z: [...prevData.accel_z, safeParseFloat(result.data.message.accel_z)],
            ph: [...prevData.ph, safeParseFloat(result.data.message.ph)],
            temperature: [...prevData.temperature, safeParseFloat(result.data.message.temperature)],
            turbidity: [...prevData.turbidity, safeParseFloat(result.data.message.turbidity)],
            speed: [...prevData.speed, safeParseFloat(result.data.message.speed)],
            timestamps: [...prevData.timestamps, timestamp],
            lastTimestamp: result.data.timestamp,
          }));
        }
      } catch (error) {
        console.error("Error fetching sensor data:", error);
      }
    };

    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [sensorData.lastTimestamp]);

  // Get paginated data
  const getPageData = (dataArray, timestampsArray, chartType) => {
    const safeData = ensureArray(dataArray);
    const safeTimestamps = ensureArray(timestampsArray);
    const page = currentPages[chartType] ?? 1;
    const startIndex = (page - 1) * dataPerPage;
    const endIndex = Math.min(startIndex + dataPerPage, safeData.length);

    if (startIndex >= safeData.length) {
      return {
        data: [],
        labels: Array(dataPerPage).fill("").map((_, i) => (i + 1).toString()),
        tooltipLabels: [],
      };
    }

    const labels = [];
    for (let i = startIndex; i < endIndex; i++) {
      labels.push((i + 1).toString());
    }

    return {
      data: safeData.slice(startIndex, endIndex),
      labels,
      tooltipLabels: safeTimestamps.slice(startIndex, endIndex),
    };
  };

  // Chart data template
  const dataTemplate = (label, dataArray, chartType) => {
    const pageData = getPageData(dataArray, sensorData.timestamps, chartType);
    
    const chartColors = {
      accel_x: "#FF6384",
      accel_y: "#36A2EB",
      accel_z: "#4BC0C0",
      ph: "#FF9F40",
      temperature: "#9966FF",
      turbidity: "#FF99CC",
      speed: "#FF99CC",
    };

    return {
      labels: pageData.labels,
      datasets: [
        {
          label,
          data: pageData.data,
          borderColor: chartColors[chartType] || "#000000",
          backgroundColor: `${chartColors[chartType] || "#000000"}1A`,
          tooltipLabels: pageData.tooltipLabels,
        },
      ],
    };
  };

  // Handle page change
  const handlePageChange = (chartType, direction) => {
    setCurrentPages((prev) => {
      const dataArray = ensureArray(sensorData[chartType]);
      const totalPages = Math.max(1, Math.ceil(dataArray.length / dataPerPage));
      const currentPage = prev[chartType] || 1;
      
      const newPage = direction === "next" 
        ? Math.min(currentPage + 1, totalPages)
        : Math.max(currentPage - 1, 1);
      
      return { ...prev, [chartType]: newPage };
    });
  };

  // Pagination controls component
  const PaginationControls = ({ chartType }) => {
    const dataArray = ensureArray(sensorData[chartType]);
    const totalPages = Math.max(1, Math.ceil(dataArray.length / dataPerPage));
    const currentPage = currentPages[chartType] || 1;
    const hasData = dataArray.length > 0;

    const getPageNumbers = () => {
      if (totalPages <= 1) return [1];
      
      const delta = 2;
      const range = [1];

      for (let i = currentPage - delta; i <= currentPage + delta; i++) {
        if (i > 1 && i < totalPages) {
          range.push(i);
        }
      }

      if (totalPages > 1) {
        range.push(totalPages);
      }

      const rangeWithDots = [];
      let prev = 0;
      
      for (const i of range) {
        if (prev + 1 < i) {
          rangeWithDots.push("...");
        }
        rangeWithDots.push(i);
        prev = i;
      }

      return rangeWithDots;
    };

    return (
      <Pagination className="justify-content-center mt-3 pagination-danger">
        <Pagination.First
          onClick={() => setCurrentPages((prev) => ({ ...prev, [chartType]: 1 }))}
          disabled={!hasData || currentPage === 1}
        />
        <Pagination.Prev
          onClick={() => handlePageChange(chartType, "prev")}
          disabled={!hasData || currentPage === 1}
        />

        {getPageNumbers().map((page, index) =>
          page === "..." ? (
            <Pagination.Ellipsis key={`ellipsis-${index}`} />
          ) : (
            <Pagination.Item
              key={page}
              active={page === currentPage}
              onClick={() => setCurrentPages((prev) => ({ ...prev, [chartType]: page }))}
            >
              {page}
            </Pagination.Item>
          )
        )}

        <Pagination.Next
          onClick={() => handlePageChange(chartType, "next")}
          disabled={!hasData || currentPage === totalPages}
        />
        <Pagination.Last
          onClick={() => setCurrentPages((prev) => ({ ...prev, [chartType]: totalPages }))}
          disabled={!hasData || currentPage === totalPages}
        />
      </Pagination>
    );
  };

  // Chart options
  const baseOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: function (context) {
            return context[0].chart.data.datasets[context[0].datasetIndex].tooltipLabels[
              context[0].dataIndex
            ];
          },
        },
      },
    },
  };

  const chartOptions = {
    ph: {
      ...baseOptions,
      scales: {
        y: {
          min: 0,
          max: 9,
          ticks: {
            stepSize: 1,
          },
        },
      },
    },
    temperature: {
      ...baseOptions,
      scales: {
        y: {
          min: 0,
          max: 1000,
          ticks: {
            stepSize: 100,
            callback: function (value) {
              return `${value}°C`;
            },
          },
        },
      },
    },
    turbidity: {
      ...baseOptions,
      scales: {
        y: {
          min: 0,
          max: 1000,
          ticks: {
            stepSize: 100,
            callback: function (value) {
              return `${value} NTU`;
            },
          },
        },
      },
    },
    acceleration: {
      ...baseOptions,
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 10,
            callback: function (value) {
              return `${value} m/s`;
            },
          },
        },
      },
    },
    speed: {
      ...baseOptions,
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 10,
            callback: function (value) {
              return `${value} m/s`;
            },
          },
        },
      },
    },
  };

  // Render chart component
  const renderChart = (title, label, dataArray, chartType, options) => {
    const useData = ensureArray(dataArray).length > 0 ? dataArray : Array(10).fill(0);
    
    return (
      <div className="chart-section">
        <h3 className="chart-title">{title}</h3>
        <Line data={dataTemplate(label, useData, chartType)} options={options} />
        <PaginationControls chartType={chartType} />
      </div>
    );
  };

  return (
    <div className="analisis-container">
      <h1 className="analisis-title">Statistik Data Langsung</h1>

      {renderChart("Acceleration X", "Accel X", sensorData.accel_x, "accel_x", chartOptions.acceleration)}
      {renderChart("Acceleration Y", "Accel Y", sensorData.accel_y, "accel_y", chartOptions.acceleration)}
      {renderChart("Acceleration Z", "Accel Z", sensorData.accel_z, "accel_z", chartOptions.acceleration)}
      {renderChart("pH", "pH", sensorData.ph, "ph", chartOptions.ph)}
      {renderChart("Temperature (°C)", "Temperature (°C)", sensorData.temperature, "temperature", chartOptions.temperature)}
      {renderChart("Turbidity", "Turbidity", sensorData.turbidity, "turbidity", chartOptions.turbidity)}
      {renderChart("Speed", "Speed", sensorData.speed, "speed", chartOptions.speed)}
    </div>
  );
};

export default Feeds;