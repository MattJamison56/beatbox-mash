/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './eventStagesChart.css'; // Import the CSS file

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const EventStagesChart: React.FC = () => {
    const [chartData, setChartData] = useState<any>(null);
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchEventStages = async () => {
            try {
                const response = await fetch(`${apiUrl}/stats/event-stages`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                // Construct the data structure required for the chart
                setChartData({
                    labels: ['Pending Response', 'Scheduled', 'Report Due', 'Pending Approval', 'Payment Due', 'Payment Sent', 'Declined'],
                    datasets: [
                        {
                            label: 'Events',
                            data: [
                                data.PendingResponse,
                                data.Scheduled,
                                data.ReportDue,
                                data.PendingApproval,
                                data.PaymentDue,
                                data.PaymentSent,
                                data.Declined
                            ],
                            backgroundColor: [
                                'rgba(75, 192, 192, 0.6)',
                                'rgba(255, 159, 64, 0.6)',
                                'rgba(153, 102, 255, 0.6)',
                                'rgba(255, 99, 132, 0.6)',
                                'rgba(54, 162, 235, 0.6)',
                                'rgba(201, 203, 207, 0.6)',
                                'rgba(255, 206, 86, 0.6)'
                            ]
                        }
                    ]
                });
            } catch (error) {
                console.error('Error fetching event stages:', error);
            }
        };

        fetchEventStages();
    }, [apiUrl]);

    if (!chartData) {
        return <div>Loading...</div>;
    }

    return (
        <div className="chart-container slide-in">
            <h2 style={{color: 'black'}}>Event Stages</h2>
            <Bar
                data={chartData}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }}
                height={200}
                width={400}
            />
        </div>
    );
};

export default EventStagesChart;
