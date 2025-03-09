import React, { useState, useEffect } from "react";
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
import { Pagination } from 'react-bootstrap';

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
  // Fungsi helper untuk memastikan nilai selalu array
  const ensureArray = (value) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [];
  };

  // Inisialisasi state dengan struktur yang aman
  const [sensorData, setSensorData] = useState(() => {
    try {
      const savedData = localStorage.getItem('sensorData');
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
        lastTimestamp: parsedData.lastTimestamp || null
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
        lastTimestamp: null
      };
    }
  });

  const [currentPages, setCurrentPages] = useState(() => {
    try {
      const savedPages = localStorage.getItem('currentPages');
      const parsedPages = savedPages ? JSON.parse(savedPages) : {};
      
      return {
        accel_x: parsedPages.accel_x || 1,
        accel_y: parsedPages.accel_y || 1,
        accel_z: parsedPages.accel_z || 1,
        ph: parsedPages.ph || 1,
        temperature: parsedPages.temperature || 1,
        turbidity: parsedPages.turbidity || 1,
        speed: parsedPages.speed || 1
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
        speed: 1
      };
    }
  });
  
  const dataPerPage = 10;

  // Fungsi untuk menghitung jumlah halaman
  const calculateTotalPages = (dataArray) => {
    if (!dataArray || !Array.isArray(dataArray)) {
      return 1;
    }
    
    const count = dataArray.length;
    return Math.max(1, Math.ceil(count / dataPerPage));
  };

  useEffect(() => {
    try {
      localStorage.setItem('sensorData', JSON.stringify(sensorData));
    } catch (error) {
      console.error("Error saving sensorData to localStorage:", error);
    }
  }, [sensorData]);

  useEffect(() => {
    try {
      localStorage.setItem('currentPages', JSON.stringify(currentPages));
    } catch (error) {
      console.error("Error saving currentPages to localStorage:", error);
    }
  }, [currentPages]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://server-water-sensors-production.up.railway.app/getCurrentData', {
          headers: {
            'Last-Timestamp': sensorData.lastTimestamp || '0'
          }
        });
        
        if (!response.ok) {
          throw new Error('Network was not response');
        }
        
        const result = await response.json();
        
        if (result.success && result.data && result.data.message && 
            (!sensorData.lastTimestamp || result.data.timestamp > sensorData.lastTimestamp)) {
          
          const timestamp = new Date(result.data.timestamp).toLocaleTimeString();
          
          setSensorData(prevData => {
            // Keamanan data
            const prevAccelX = ensureArray(prevData.accel_x);
            const prevAccelY = ensureArray(prevData.accel_y);
            const prevAccelZ = ensureArray(prevData.accel_z);
            const prevPh = ensureArray(prevData.ph);
            const prevTemp = ensureArray(prevData.temperature);
            const prevTurb = ensureArray(prevData.turbidity);
            const prevSpeed = ensureArray(prevData.speed);
            const prevTimestamps = ensureArray(prevData.timestamps);
            
            const newData = {
              accel_x: [...prevAccelX, result.data.message.accel_x],
              accel_y: [...prevAccelY, result.data.message.accel_y],
              accel_z: [...prevAccelZ, result.data.message.accel_z],
              ph: [...prevPh, parseFloat(result.data.message.ph || 0)],
              temperature: [...prevTemp, parseFloat(result.data.message.temperature || 0)],
              turbidity: [...prevTurb, parseFloat(result.data.message.turbidity || 0)],
              speed: [...prevSpeed, parseFloat(result.data.message.speed || 0)],
              timestamps: [...prevTimestamps, timestamp],
              lastTimestamp: result.data.timestamp
            };
            
            return newData;
          });
        }
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      }
    };

    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [sensorData.lastTimestamp]);

  useEffect(() => {
    console.log('Data Speed:', sensorData.speed);
  }, [sensorData.speed]);

  // Pendekatan baru untuk pagination yang tidak bergantung pada length
  const getPageData = (dataArray, timestampsArray, chartType) => {
    // Memastikan data adalah array yang valid
    const safeData = ensureArray(dataArray);
    const safeTimestamps = ensureArray(timestampsArray);
    
    // Gunakan nullish coalescing untuk menghindari nilai undefined/null
    const page = currentPages[chartType] ?? 1;
    
    const startIndex = (page - 1) * dataPerPage;
    let endIndex = startIndex + dataPerPage;
    
    // Pastikan indeks selalu valid
    if (startIndex >= safeData.length) {
      return {
        data: [],
        labels: Array(dataPerPage).fill('').map((_, i) => (i + 1).toString()),
        tooltipLabels: []
      };
    }
    
    // Membatasi endIndex pada ukuran array
    endIndex = Math.min(endIndex, safeData.length);
    
    // Membuat array label yang aman
    const labels = [];
    for (let i = startIndex; i < endIndex; i++) {
      labels.push((i + 1).toString());
    }
    
    return {
      data: safeData.slice(startIndex, endIndex),
      labels: labels,
      tooltipLabels: safeTimestamps.slice(startIndex, endIndex)
    };
  };

  const dataTemplate = (label, dataArray, chartType) => {
    const pageData = getPageData(dataArray, sensorData.timestamps, chartType);
    
    // Konfigurasi warna untuk setiap jenis chart
    const chartColors = {
      accel_x: "#FF6384", // Merah
      accel_y: "#36A2EB", // Biru
      accel_z: "#4BC0C0", // Hijau
      ph: "#FF9F40",      // Oranye
      temperature: "#9966FF", // Ungu
      turbidity: "#FF99CC",    // Pink
      speed: "#FF99CC"    // Pink
    };

    return {
      labels: pageData.labels,
      datasets: [
        {
          label: label,
          data: pageData.data,
          borderColor: chartColors[chartType] || "#000000",
          backgroundColor: `${chartColors[chartType] || "#000000"}1A`,
          tooltipLabels: pageData.tooltipLabels,
        },
      ],
    };
  };

  const handlePageChange = (chartType, direction) => {
    setCurrentPages(prev => {
      const dataArray = ensureArray(sensorData[chartType]);
      const totalPages = calculateTotalPages(dataArray);
      const currentPage = prev[chartType] || 1;
      
      const newPage = direction === 'next' 
        ? Math.min(currentPage + 1, totalPages)
        : Math.max(currentPage - 1, 1);
      
      return { ...prev, [chartType]: newPage };
    });
  };

  const PaginationControls = ({ chartType }) => {
    const dataArray = ensureArray(sensorData[chartType]);
    const totalPages = calculateTotalPages(dataArray);
    const currentPage = currentPages[chartType] || 1;
    const hasData = dataArray.length > 0;

    // Fungsi untuk menentukan halaman yang akan ditampilkan
    const getPageNumbers = () => {
      if (totalPages <= 1) return [1];
      
      const delta = 2; // Jumlah halaman yang ditampilkan di sekitar halaman aktif
      const range = [];
      const rangeWithDots = [];

      // Selalu tampilkan halaman pertama
      range.push(1);

      for (let i = currentPage - delta; i <= currentPage + delta; i++) {
        if (i > 1 && i < totalPages) {
          range.push(i);
        }
      }

      // Selalu tampilkan halaman terakhir
      if (totalPages > 1) {
        range.push(totalPages);
      }

      // Tambahkan ellipsis jika diperlukan
      let prev = 0;
      for (const i of range) {
        if (prev + 1 < i) {
          rangeWithDots.push('...');
        }
        rangeWithDots.push(i);
        prev = i;
      }

      return rangeWithDots;
    };

    return (
      <Pagination className="justify-content-center mt-3 pagination-danger">
        <Pagination.First 
          onClick={() => setCurrentPages(prev => ({ ...prev, [chartType]: 1 }))}
          disabled={!hasData || currentPage === 1}
        />
        <Pagination.Prev 
          onClick={() => handlePageChange(chartType, 'prev')}
          disabled={!hasData || currentPage === 1}
        />

        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <Pagination.Ellipsis key={`ellipsis-${index}`} />
          ) : (
            <Pagination.Item
              key={page}
              active={page === currentPage}
              onClick={() => setCurrentPages(prev => ({ ...prev, [chartType]: page }))}
            >
              {page}
            </Pagination.Item>
          )
        ))}

        <Pagination.Next 
          onClick={() => handlePageChange(chartType, 'next')}
          disabled={!hasData || currentPage === totalPages}
        />
        <Pagination.Last 
          onClick={() => setCurrentPages(prev => ({ ...prev, [chartType]: totalPages }))}
          disabled={!hasData || currentPage === totalPages}
        />
      </Pagination>
    );
  };

  // Render chart dengan memeriksa data terlebih dahulu
  const renderChart = (title, label, dataArray, chartType, options) => {
    // Menyiapkan data default jika tidak ada data
    const defaultData = Array(10).fill(0);
    const useData = (Array.isArray(dataArray) && dataArray.length > 0) ? dataArray : defaultData;
    
    return (
      <div className="chart-section">
        <h3 className="chart-title">{title}</h3>
        <Line
          data={dataTemplate(label, useData, chartType)}
          options={options}
        />
        <PaginationControls chartType={chartType} />
      </div>
    );
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            const datasetIndex = context[0].datasetIndex;
            const dataIndex = context[0].dataIndex;
            return context[0].chart.data.datasets[datasetIndex].tooltipLabels[dataIndex];
          }
        }
      }
    },
  };

  const phOptions = {
    ...options,
    scales: {
      y: {
        min: 0,
        max: 9,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const temperatureOptions = {
    ...options,
    scales: {
      y: {
        min: 0,
        max: 1000,
        ticks: {
          stepSize: 100,
          callback: function(value) {
            return value + '°C';
          }
        }
      }
    }
  };

  const turbidityOptions = {
    ...options,
    scales: {
      y: {
        min: 0,
        max: 1000,
        ticks: {
          stepSize: 100,
          callback: function(value) {
            return value + ' NTU';
          }
        }
      }
    }
  };

  const accelOptions = {
    ...options,
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 10,
          callback: function(value) {
            return value + ' m/s';
          }
        }
      }
    }
  };

  const speedOptions = {
    ...options,
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 10,
          callback: function(value) {
            return value + ' m/s';
          }
        }
      }
    }
  };

  return (
    <div className="analisis-container">
      <h1 className="analisis-title">Statistik Data Langsung</h1>

      {renderChart("Acceleration X", "Accel X", sensorData.accel_x, "accel_x", accelOptions)}
      {renderChart("Acceleration Y", "Accel Y", sensorData.accel_y, "accel_y", accelOptions)}
      {renderChart("Acceleration Z", "Accel Z", sensorData.accel_z, "accel_z", accelOptions)}
      {renderChart("pH", "pH", sensorData.ph, "ph", phOptions)}
      {renderChart("Temperature (°C)", "Temperature (°C)", sensorData.temperature, "temperature", temperatureOptions)}
      {renderChart("Turbidity", "Turbidity", sensorData.turbidity, "turbidity", turbidityOptions)}
      {renderChart("Speed", "Speed", sensorData.speed, "speed", speedOptions)}
    </div>
  );
};

export default Feeds;
