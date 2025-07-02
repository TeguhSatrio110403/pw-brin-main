import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Pagination, Form, Spinner, Modal, Button, InputGroup, FormControl, Card } from "react-bootstrap";
import { FaWater, FaMapMarkerAlt, FaCheck, FaDownload } from 'react-icons/fa';
import { BsClock, BsWater, BsGeoAlt } from 'react-icons/bs';
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
import { port } from '../constant/https.jsx';

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
  // State untuk data sensor
  const [sensorData, setSensorData] = useState({
        accel_x: [],
        accel_y: [],
        accel_z: [],
        ph: [],
        temperature: [],
        turbidity: [],
        speed: [],
        timestamps: [],
        lastTimestamp: null,
  });

  // State untuk lokasi
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("semua");
  const [selectedTimeRange, setSelectedTimeRange] = useState("ALL");

  // State untuk pagination
  const [currentPages, setCurrentPages] = useState({
        accel_x: 1,
        accel_y: 1,
        accel_z: 1,
        ph: 1,
        temperature: 1,
        turbidity: 1,
        speed: 1,
  });

  // State untuk loading
  const [isLoading, setIsLoading] = useState(false);

  // State untuk modal dan search
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredLocations, setFilteredLocations] = useState([]);

  const dataPerPage = 10;

  // Konstanta untuk rentang waktu
  const TIME_RANGES = [
    { value: "ALL", label: "Semua Waktu" },
    { value: "1H", label: "1 Jam Terakhir" },
    { value: "3H", label: "3 Jam Terakhir" },
    { value: "7H", label: "7 Jam Terakhir" },
    { value: "1D", label: "1 Hari Terakhir" },
    { value: "2D", label: "2 Hari Terakhir" },
    { value: "3D", label: "3 Hari Terakhir" },
    { value: "7D", label: "7 Hari Terakhir" },
    { value: "1M", label: "1 Bulan Terakhir" },
    { value: "3M", label: "3 Bulan Terakhir" },
    { value: "6M", label: "6 Bulan Terakhir" },
    { value: "1Y", label: "1 Tahun Terakhir" }
  ];

  // Fetch locations from server
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch(`${port}data_lokasi`);
        if (!response.ok) throw new Error("Network response was not ok");
        const result = await response.json();
        if (result && Array.isArray(result)) {
          setLocations(result);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, []);

  // Filter lokasi berdasarkan search term
  useEffect(() => {
    if (locations) {
      const filtered = locations.filter(location =>
        location.nama_sungai.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLocations(filtered);
    }
  }, [searchTerm, locations]);

  // Fungsi untuk mengambil semua data dengan pagination
  const fetchAllData = async (url, page = 1) => {
    let allData = [];
    let currentPage = page;
    let hasMoreData = true;

    while (hasMoreData) {
      try {
        // Tambahkan parameter range ke URL jika bukan "ALL"
        let apiUrl = url;
        if (selectedTimeRange !== "ALL") {
          apiUrl += `&range=${selectedTimeRange}`;
        }
        apiUrl += `&page=${currentPage}`;

        console.log('Fetching data from:', apiUrl);
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API responded with status ${response.status}`);

        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
          allData = [...allData, ...result.data];
          currentPage++;
          hasMoreData = currentPage <= result.totalPage;
        } else {
          hasMoreData = false;
        }
      } catch (error) {
        console.error(`Error fetching page ${currentPage}:`, error);
        hasMoreData = false;
      }
    }

    return allData;
  };

  // Fetch sensor data based on selected location and time range
  useEffect(() => {
    const fetchSensorData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching data for location:', selectedLocation, 'and time range:', selectedTimeRange);
        
        // Fungsi untuk mengkonversi range ke format yang sesuai
        const getRangeFormat = (range) => {
          switch(range) {
            case '1H': return '1h';
            case '3H': return '3h';
            case '7H': return '7h';
            case '1D': return '1d';
            case '2D': return '2d';
            case '3D': return '3d';
            case '7D': return '7d';
            case '1M': return '30d';
            case '3M': return '90d';
            case '6M': return '180d';
            case '1Y': return '365d';
            default: return '';
          }
        };

        const rangeFormat = getRangeFormat(selectedTimeRange);
        const baseUrl = `${port}data_combined`;
        let apiUrl = '';
        
        if (selectedLocation && selectedLocation !== "semua") {
          apiUrl = `${baseUrl}/${selectedLocation}?limit=1000`;
        } else {
          apiUrl = `${baseUrl}?limit=1000`;
        }

        // Tambahkan parameter range jika bukan "ALL"
        if (selectedTimeRange !== "ALL" && rangeFormat) {
          apiUrl += `&range=${rangeFormat}`;
        }

        console.log('API URL:', apiUrl);
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API responded with status ${response.status}`);
        
        const result = await response.json();
        console.log('API Response:', result);

        if (!result.success || !result.data) {
          throw new Error('Invalid data format received from API');
        }

        // Filter data berdasarkan rentang waktu yang dipilih
        const now = new Date();
        const filterDataByTimeRange = (date) => {
          const dataDate = new Date(date);
          const diffInHours = (now - dataDate) / (1000 * 60 * 60);
          
          switch(selectedTimeRange) {
            case '1H': return diffInHours <= 1;
            case '3H': return diffInHours <= 3;
            case '7H': return diffInHours <= 7;
            case '1D': return diffInHours <= 24;
            case '2D': return diffInHours <= 48;
            case '3D': return diffInHours <= 72;
            case '7D': return diffInHours <= 168;
            case '1M': return diffInHours <= 720;
            case '3M': return diffInHours <= 2160;
            case '6M': return diffInHours <= 4320;
            case '1Y': return diffInHours <= 8760;
            default: return true;
          }
        };

        // Format dan filter data
        const formattedData = result.data
          .map(item => {
            const date = new Date(item.tanggal);
            const formattedDate = date.toLocaleString('id-ID', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            });

            return {
              accel_x: parseFloat(item.nilai_accel_x) || 0,
              accel_y: parseFloat(item.nilai_accel_y) || 0,
              accel_z: parseFloat(item.nilai_accel_z) || 0,
              ph: parseFloat(item.nilai_ph) || 0,
              temperature: parseFloat(item.nilai_temperature) || 0,
              turbidity: parseFloat(item.nilai_turbidity) || 0,
              speed: parseFloat(item.nilai_speed) || 0,
              timestamp: formattedDate,
              rawDate: date
            };
          })
          .filter(item => filterDataByTimeRange(item.rawDate))
          .sort((a, b) => b.rawDate - a.rawDate);

        console.log('Filtered data:', formattedData);

        // Update state dengan data yang sudah diformat
        setSensorData({
          accel_x: formattedData.map(d => d.accel_x),
          accel_y: formattedData.map(d => d.accel_y),
          accel_z: formattedData.map(d => d.accel_z),
          ph: formattedData.map(d => d.ph),
          temperature: formattedData.map(d => d.temperature),
          turbidity: formattedData.map(d => d.turbidity),
          speed: formattedData.map(d => d.speed),
          timestamps: formattedData.map(d => d.timestamp),
          lastTimestamp: formattedData[0]?.timestamp || null
        });

        // Reset pagination ke halaman pertama saat lokasi atau time range berubah
        setCurrentPages({
          accel_x: 1,
          accel_y: 1,
          accel_z: 1,
          ph: 1,
          temperature: 1,
          turbidity: 1,
          speed: 1,
        });
      } catch (error) {
        console.error("Error fetching sensor data:", error);
        setSensorData({
          accel_x: [],
          accel_y: [],
          accel_z: [],
          ph: [],
          temperature: [],
          turbidity: [],
          speed: [],
          timestamps: [],
          lastTimestamp: null
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSensorData();
  }, [selectedLocation, selectedTimeRange]);

  // Get paginated data
  const getPageData = (dataArray, timestampsArray, chartType) => {
    const page = currentPages[chartType] || 1;
    const startIndex = (page - 1) * dataPerPage;
    const endIndex = Math.min(startIndex + dataPerPage, dataArray.length);

    if (startIndex >= dataArray.length) {
      return {
        data: [],
        labels: Array(dataPerPage).fill("").map((_, i) => (i + 1).toString()),
        tooltipLabels: [],
      };
    }

    // Data sudah terurut dari terbaru ke terlama
    return {
      data: dataArray.slice(startIndex, endIndex),
      labels: timestampsArray.slice(startIndex, endIndex),
      tooltipLabels: timestampsArray.slice(startIndex, endIndex),
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
      const totalPages = Math.max(1, Math.ceil(sensorData[chartType].length / dataPerPage));
      const currentPage = prev[chartType] || 1;
      
      const newPage = direction === "next" 
        ? Math.min(currentPage + 1, totalPages)
        : Math.max(currentPage - 1, 1);
      
      return { ...prev, [chartType]: newPage };
    });
  };

  // Pagination controls component
  const PaginationControls = ({ chartType }) => {
    const totalPages = Math.max(1, Math.ceil(sensorData[chartType].length / dataPerPage));
    const currentPage = currentPages[chartType] || 1;
    const hasData = sensorData[chartType].length > 0;

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
          label: function(context) {
            const value = context.raw;
            const chartType = context.dataset.label.toLowerCase();
            
            if (chartType.includes('ph')) {
              return `pH: ${value}`;
            } else if (chartType.includes('temperature')) {
              return `Suhu: ${value}°C`;
            } else if (chartType.includes('turbidity')) {
              return `Kekeruhan: ${value} NTU`;
            } else if (chartType.includes('accel') || chartType.includes('speed')) {
              return `Nilai: ${value} m/s`;
            }
            return `Nilai: ${value}`;
          }
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
          max: 14,
          ticks: {
            stepSize: 1,
            callback: function (value) {
              return value.toFixed(1);
            },
          },
          // title: {
          //   display: true,
          //   text: 'pH Level'
          // }
        },
        x: {
          title: {
            display: true,
            text: 'Waktu'
          }
        }
      },
    },
    temperature: {
      ...baseOptions,
      scales: {
        y: {
          min: -60,
          max: 100,
          ticks: {
            stepSize: 20,
            callback: function (value) {
              return `${value}°C`;
            },
          },
          // title: {
          //   display: true,
          //   text: 'Suhu (°C)'
          // }
        },
        x: {
          title: {
            display: true,
            text: 'Waktu'
          }
        }
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
          // title: {
          //   display: true,
          //   text: 'Kekeruhan (NTU)'
          // }
        },
        x: {
          title: {
            display: true,
            text: 'Waktu'
          }
        }
      },
    },
    acceleration: {
      ...baseOptions,
      scales: {
        y: {
          min: -6,
          max: 10,
          ticks: {
            stepSize: 2,
            callback: function (value) {
              return `${value} m/s²`;
            },
          },
          // title: {
          //   display: true,
          //   text: 'Percepatan (m/s²)'
          // }
        },
        x: {
          title: {
            display: true,
            text: 'Waktu'
          }
        }
      },
    },
    speed: {
      ...baseOptions,
      scales: {
        y: {
          min: -12,
          max: 20,
          ticks: {
            stepSize: 4,
            callback: function (value) {
              return `${value} m/s`;
            },
          },
          // title: {
          //   display: true,
          //   text: 'Kecepatan (m/s)'
          // }
        },
        x: {
          title: {
            display: true,
            text: 'Waktu'
          }
        }
      },
    },
  };

  // Render chart component dengan pengecekan data
  const renderChart = (title, label, dataArray, chartType, options) => {
    const hasData = dataArray && dataArray.length > 0;
    const selectedLocationName = selectedLocation === "semua" 
      ? "Semua Lokasi" 
      : locations.find(loc => loc.id_lokasi === selectedLocation)?.nama_sungai || "Lokasi tidak ditemukan";
    
    const getTimeRangeLabel = (range) => {
      const timeRange = TIME_RANGES.find(r => r.value === range);
      return timeRange ? timeRange.label : range;
    };
    
    return (
      <div className="chart-section">
        <h3 className="chart-title">{title}</h3>
        {isLoading ? (
          <div className="text-center p-5">
            <Spinner animation="border" style={{ color: '#E62F2A' }} />
            <p className="mt-2">Memuat data...</p>
          </div>
        ) : !hasData ? (
          <div className="text-center p-5">
            <p className="text-muted">
              {selectedTimeRange === "ALL" 
                ? "Data statistik tidak tersedia untuk lokasi ini"
                : `Tidak ada data untuk ${title} pada rentang waktu ${getTimeRangeLabel(selectedTimeRange)}`
              }
            </p>
          </div>
        ) : (
          <>
            <Line data={dataTemplate(label, dataArray, chartType)} options={options} />
            <PaginationControls chartType={chartType} />
          </>
        )}
      </div>
    );
  };

  // Fungsi untuk mengecek apakah semua data kosong
  const isAllDataEmpty = () => {
    return (
      sensorData.accel_x.length === 0 &&
      sensorData.accel_y.length === 0 &&
      sensorData.accel_z.length === 0 &&
      sensorData.ph.length === 0 &&
      sensorData.temperature.length === 0 &&
      sensorData.turbidity.length === 0 &&
      sensorData.speed.length === 0
    );
  };

  // Fungsi untuk mengkonversi data ke format CSV
  const convertToCSV = (data) => {
    const headers = [
      'Tanggal',
      'Accelerometer X (m/s²)',
      'Accelerometer Y (m/s²)',
      'Accelerometer Z (m/s²)',
      'pH',
      'Suhu Air (°C)',
      'Tingkat Kekeruhan (NTU)',
      'Kecepatan Alat (m/s)'
    ];

    const rows = data.map(item => [
      item.timestamp,
      item.accel_x,
      item.accel_y,
      item.accel_z,
      item.ph,
      item.temperature,
      item.turbidity,
      item.speed
    ]);

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  };

  // Fungsi untuk mengunduh data
  const handleDownload = async () => {
    try {
      setIsLoading(true);
      const baseUrl = `${port}data_combined`;
      let apiUrl = '';
      
      if (selectedLocation && selectedLocation !== "semua") {
        apiUrl = `${baseUrl}/${selectedLocation}?limit=1000`;
      } else {
        apiUrl = `${baseUrl}?limit=1000`;
      }

      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`API responded with status ${response.status}`);
      
      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error('Invalid data format received from API');
      }

      // Format data untuk CSV
      const formattedData = result.data.map(item => ({
        timestamp: new Date(item.tanggal).toLocaleString('id-ID', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }),
        accel_x: parseFloat(item.nilai_accel_x) || 0,
        accel_y: parseFloat(item.nilai_accel_y) || 0,
        accel_z: parseFloat(item.nilai_accel_z) || 0,
        ph: parseFloat(item.nilai_ph) || 0,
        temperature: parseFloat(item.nilai_temperature) || 0,
        turbidity: parseFloat(item.nilai_turbidity) || 0,
        speed: parseFloat(item.nilai_speed) || 0
      }));

      // Konversi ke CSV
      const csv = convertToCSV(formattedData);
      
      // Buat blob dan download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Set nama file berdasarkan lokasi dan waktu
      const locationName = selectedLocation === "semua" 
        ? "semua-lokasi" 
        : locations.find(loc => loc.id_lokasi === selectedLocation)?.nama_sungai || "unknown";
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `data-sensor-${locationName}-${date}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading data:", error);
      alert("Gagal mengunduh data. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="analisis-container">
      {/* <h1 className="analisis-title">Statistik Data Langsung</h1> */}
      
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div className="d-flex gap-3">
          <Button 
            variant="outline-danger" 
            onClick={() => setShowModal(true)}
            style={{ 
              minWidth: '200px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderWidth: '1px',
              borderColor: '#dc3545',
              color: '#dc3545',
              backgroundColor: 'transparent',
              transition: 'all 0.2s ease-in-out'
            }}
            className="hover-effect"
          >
            <BsGeoAlt style={{ fontSize: '16px' }} />
            {selectedLocation === "semua" 
              ? "Semua Lokasi" 
              : locations.find(loc => loc.id_lokasi === selectedLocation)?.nama_sungai || "Pilih Lokasi"}
          </Button>

          <div style={{ position: 'relative' }}>
            <Form.Select
              id="timeRangeSelect"
              name="timeRangeSelect"
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              style={{ 
                minWidth: '200px',
                height: '38px',
                borderColor: '#dc3545',
                color: '#dc3545',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                paddingLeft: '40px'
              }}
              className="border-danger custom-select"
              aria-label="Pilih rentang waktu"
            >
              {TIME_RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </Form.Select>
            <BsClock 
              style={{ 
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '16px',
                color: '#dc3545',
                pointerEvents: 'none'
              }} 
            />
          </div>

          <Button 
            variant="outline-danger" 
            onClick={handleDownload}
            disabled={isLoading}
            style={{ 
              minWidth: '150px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderWidth: '1px',
              borderColor: '#dc3545',
              color: '#dc3545',
              backgroundColor: 'transparent',
              transition: 'all 0.2s ease-in-out'
            }}
            className="hover-effect"
          >
            <FaDownload style={{ fontSize: '16px' }} />
            {isLoading ? 'Mengunduh...' : 'Unduh CSV'}
          </Button>
        </div>
      </div>

      <style>
        {`
          .hover-effect:hover {
            background-color: #dc3545 !important;
            color: white !important;
          }
          
          .hover-effect:hover svg {
            color: white !important;
          }
          
          .custom-select {
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23dc3545' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 12px center;
            background-size: 16px;
            padding-right: 32px;
          }

          .custom-select:focus {
            box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25);
            border-color: #dc3545;
          }

          .custom-select option {
            background-color: white;
            color: #212529;
          }

          .custom-select option:checked {
            background-color: #dc3545;
            color: white;
          }
        `}
      </style>

      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)} 
        size="lg"
        centered
        className="location-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>
            Pilih Lokasi Sungai
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <div className="search-input-wrapper mb-4" style={{ position: 'relative', flex: 1 }}>
            <FaMapMarkerAlt 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#6c757d'
              }} 
            />
            <FormControl
              id="location-search"
              name="location-search"
              placeholder="Cari lokasi sungai..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                paddingLeft: '40px',
                borderRadius: '12px',
                border: '1px solid #ced4da',
                fontSize: '14px',
                height: '45px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
              aria-label="Cari lokasi sungai"
            />
          </div>
          
          <div className="location-list" style={{ 
            maxHeight: '400px', 
            overflowY: 'auto', 
            overflowX: 'hidden',
            padding: '0 4px'
          }}>
            <div className="row g-3 mx-0">
              <div className="col-md-4 px-2">
                <Card 
                  className={`h-100 location-card ${selectedLocation === "semua" ? 'selected' : ''}`}
                  style={{ 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '1px solid #e9ecef',
                    borderRadius: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  onClick={() => {
                    setSelectedLocation("semua");
                    setShowModal(false);
                    setSearchTerm("");
                  }}
                >
                  <Card.Body className="d-flex flex-column justify-content-between p-3">
                    <div>
                      <h5 className="mb-2">
                        Semua Lokasi
                      </h5>
                      <p className="text-muted mb-0 small">Menampilkan data dari semua lokasi</p>
                    </div>
                    {selectedLocation === "semua" && (
                      <div className="text-end mt-2">
                        <FaCheck className="text-danger" size={20} />
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </div>
              
              {filteredLocations.map((location) => (
                <div key={location.id_lokasi} className="col-md-4 px-2">
                  <Card 
                    className={`h-100 location-card ${selectedLocation === location.id_lokasi ? 'selected' : ''}`}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: '1px solid #e9ecef',
                      borderRadius: '12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                    onClick={() => {
                      setSelectedLocation(location.id_lokasi);
                      setShowModal(false);
                      setSearchTerm("");
                    }}
                  >
                    <Card.Body className="d-flex flex-column justify-content-between p-3">
                      <div>
                        <h5 className="mb-2">
                          {location.nama_sungai}
                        </h5>
                        <p className="text-muted mb-0 small">
                          <FaMapMarkerAlt className="me-1" />
                          {location.alamat || 'Alamat tidak tersedia'}
                        </p>
                      </div>
                      {selectedLocation === location.id_lokasi && (
                        <div className="text-end mt-2">
                          <FaCheck className="text-danger" size={20} />
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </Modal.Body>
      </Modal>

      <style>
        {`
          .location-modal .modal-content {
            border-radius: 16px;
            border: none;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          }

          .location-modal .modal-header {
            padding: 1.5rem 1.5rem 0.5rem;
          }

          .location-modal .modal-body {
            padding: 1rem 1.5rem 1.5rem;
          }

          .location-card {
            transition: all 0.3s ease;
          }

          .location-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
          }

          .location-card.selected {
            border-color: #dc3545 !important;
            background-color: #fff5f5;
          }

          .location-list::-webkit-scrollbar {
            width: 8px;
          }

          .location-list::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }

          .location-list::-webkit-scrollbar-thumb {
            background: #dc3545;
            border-radius: 4px;
          }

          .location-list::-webkit-scrollbar-thumb:hover {
            background: #c82333;
          }

          .search-input-wrapper input:focus {
            border-color: #dc3545;
            box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
          }
        `}
      </style>

      {!isLoading && isAllDataEmpty() ? (
        <div className="text-center p-5">
          <h4 className="text-muted">Data statistik tidak tersedia untuk lokasi yang dipilih</h4>
        </div>
      ) : (
        <>
          {renderChart("Accelerometer X", "Accel X", sensorData.accel_x, "accel_x", chartOptions.acceleration)}
          {renderChart("Accelerometer Y", "Accel Y", sensorData.accel_y, "accel_y", chartOptions.acceleration)}
          {renderChart("Accelerometer Z", "Accel Z", sensorData.accel_z, "accel_z", chartOptions.acceleration)}
          {renderChart("pH", "pH", sensorData.ph, "ph", chartOptions.ph)}
          {renderChart("Suhu Air", "Suhu Air", sensorData.temperature, "temperature", chartOptions.temperature)}
          {renderChart("Tingkat Kekeruhan", "Tingkat Kekeruhan", sensorData.turbidity, "turbidity", chartOptions.turbidity)}
          {renderChart("Kecepatan Alat", "Speed", sensorData.speed, "speed", chartOptions.speed)}
        </>
      )}
    </div>
  );
};

export default Feeds;