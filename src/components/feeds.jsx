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
  const [sensorData, setSensorData] = useState(() => {
    // Mengambil data dari localStorage saat inisialisasi
    const savedData = localStorage.getItem('sensorData');
    return savedData ? JSON.parse(savedData) : {
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
  });

  const [currentPages, setCurrentPages] = useState(() => {
    // Mengambil state halaman dari localStorage
    const savedPages = localStorage.getItem('currentPages');
    return savedPages ? JSON.parse(savedPages) : {
      accel_x: 1,
      accel_y: 1,
      accel_z: 1,
      ph: 1,
      temperature: 1,
      turbidity: 1,
      speed: 1
    };
  });
  
  const dataPerPage = 10;

  useEffect(() => {
    // Menyimpan data ke localStorage setiap kali sensorData berubah
    localStorage.setItem('sensorData', JSON.stringify(sensorData));
  }, [sensorData]);

  useEffect(() => {
    // Menyimpan state halaman ke localStorage
    localStorage.setItem('currentPages', JSON.stringify(currentPages));
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
        
        if (result.success && result.data.message && (!sensorData.lastTimestamp || result.data.timestamp > sensorData.lastTimestamp)) {
          const timestamp = new Date(result.data.timestamp).toLocaleTimeString();
          setSensorData(prevData => {
            const newData = {
              ...prevData,
              accel_x: [...prevData.accel_x, result.data.message.accel_x],
              accel_y: [...prevData.accel_y, result.data.message.accel_y],
              accel_z: [...prevData.accel_z, result.data.message.accel_z],
              ph: [...prevData.ph, parseFloat(result.data.message.ph)],
              temperature: [...prevData.temperature, parseFloat(result.data.message.temperature)],
              turbidity: [...prevData.turbidity, parseFloat(result.data.message.turbidity)],
              speed: [...prevData.speed, parseFloat(result.data.message.speed)],
              timestamps: [...prevData.timestamps, timestamp],
              lastTimestamp: result.data.timestamp
            };
            
            const totalPages = Math.ceil(newData.timestamps.length / dataPerPage);
            setCurrentPages(prev => ({ 
              ...prev, 
              accel_x: totalPages, 
              accel_y: totalPages, 
              accel_z: totalPages, 
              ph: totalPages, 
              temperature: totalPages, 
              turbidity: totalPages,
              speed: totalPages
            }));
            
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

  const getPageData = (data, timestamps, chartType) => {
    const startIndex = (currentPages[chartType] - 1) * dataPerPage;
    const endIndex = startIndex + dataPerPage;
    
    // Membuat array label berdasarkan indeks data
    const labels = Array.from(
      { length: Math.min(dataPerPage, data.length - startIndex) },
      (_, i) => (startIndex + i + 1).toString()
    );
    
    return {
      data: data.slice(startIndex, endIndex),
      labels: labels,
      tooltipLabels: timestamps.slice(startIndex, endIndex)
    };
  };

  const dataTemplate = (label, data, chartType) => {
    const pageData = getPageData(data, sensorData.timestamps, chartType);
    
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
          borderColor: chartColors[chartType],
          backgroundColor: `${chartColors[chartType]}1A`, // Menambahkan transparansi 10%
          tooltipLabels: pageData.tooltipLabels,
        },
      ],
    };
  };

  const handlePageChange = (chartType, direction) => {
    setCurrentPages(prev => {
      const totalPages = Math.ceil(sensorData.timestamps.length / dataPerPage);
      const newPage = direction === 'next' 
        ? Math.min(prev[chartType] + 1, totalPages)
        : Math.max(prev[chartType] - 1, 1);
      return { ...prev, [chartType]: newPage };
    });
  };

  const PaginationControls = ({ chartType }) => {
    const totalPages = Math.ceil(sensorData.timestamps.length / dataPerPage);
    const currentPage = currentPages[chartType];
    const hasData = sensorData[chartType].length > 0;

    // Fungsi untuk menentukan halaman yang akan ditampilkan
    const getPageNumbers = () => {
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

      <div className="chart-section">
        <h3 className="chart-title">Acceleration X</h3>
        <Line
          data={dataTemplate(
            "Accel X",
            sensorData.accel_x.length ? sensorData.accel_x : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "accel_x"
          )}
          options={accelOptions}
        />
        <PaginationControls chartType="accel_x" />
      </div>

      <div className="chart-section">
        <h3 className="chart-title">Acceleration Y</h3>
        <Line
          data={dataTemplate(
            "Accel Y",
            sensorData.accel_y.length ? sensorData.accel_y : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "accel_y"
          )}
          options={accelOptions}
        />
        <PaginationControls chartType="accel_y" />
      </div>

      <div className="chart-section">
        <h3 className="chart-title">Acceleration Z</h3>
        <Line
          data={dataTemplate(
            "Accel Z",
            sensorData.accel_z.length ? sensorData.accel_z : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "accel_z"
          )}
          options={accelOptions}
        />
        <PaginationControls chartType="accel_z" />
      </div>

      <div className="chart-section">
        <h3 className="chart-title">pH</h3>
        <Line
          data={dataTemplate(
            "pH",
            sensorData.ph.length ? sensorData.ph : Array(10).fill(0),
            "ph"
          )}
          options={phOptions}
        />
        <PaginationControls chartType="ph" />
      </div>

      <div className="chart-section">
        <h3 className="chart-title">Temperature (°C)</h3>
        <Line
          data={dataTemplate(
            "Temperature (°C)",
            sensorData.temperature.length ? sensorData.temperature : Array(10).fill(0),
            "temperature"
          )}
          options={temperatureOptions}
        />
        <PaginationControls chartType="temperature" />
      </div>

      <div className="chart-section">
        <h3 className="chart-title">Turbidity</h3>
        <Line
          data={dataTemplate(
            "Turbidity",
            sensorData.turbidity.length ? sensorData.turbidity : Array(10).fill(0),
            "turbidity"
          )}
          options={turbidityOptions}
        />
        <PaginationControls chartType="turbidity" />
      </div>

      <div className="chart-section">
        <h3 className="chart-title">Speed</h3>
        <Line
          data={dataTemplate(
            "Speed",
            sensorData.speed.length ? sensorData.speed : Array(10).fill(0),
            "speed"
          )}
          options={speedOptions}
        />
        <PaginationControls chartType="speed" />
      </div>

    </div>
  );
};

export default Feeds;
