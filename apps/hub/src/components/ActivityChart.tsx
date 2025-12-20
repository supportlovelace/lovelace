import ReactECharts from 'echarts-for-react';

export function ActivityChart() {
  const onChartClick = (params: any) => {
    alert(`Détails demandés :\nJour : ${params.name}\nVolume : ${params.value} messages\n\nIci on ouvrira un Dialog avec la liste des messages bruts.`);
  };

  const onEvents = {
    'click': onChartClick
  };

  const option = {
    title: {
      text: 'Activité Community (Mock)',
      left: 'center',
      textStyle: {
        color: '#48355E',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        axisTick: { alignWithLabel: true }
      }
    ],
    yAxis: [
      { type: 'value' }
    ],
    series: [
      {
        name: 'Messages',
        type: 'bar',
        barWidth: '60%',
        data: [420, 580, 390, 720, 850, 410, 320],
        itemStyle: {
          color: '#48355E',
          borderRadius: [4, 4, 0, 0]
        },
        cursor: 'pointer',
        emphasis: {
          itemStyle: {
            color: '#634a82'
          }
        }
      }
    ]
  };

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <ReactECharts 
        option={option} 
        onEvents={onEvents}
        style={{ height: '300px' }} 
      />
    </div>
  );
}
