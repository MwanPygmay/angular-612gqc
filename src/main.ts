import 'zone.js/dist/zone';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'my-app',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main.html',
  styleUrls: ['./main.css'],
})
export class App implements OnInit {
  name = 'Angular';

  ngOnInit() {
    var ctx = document.getElementById('myChart') as HTMLCanvasElement;
    //var data = [61, 10, 28];
    const getSuitableY = (y, yArray = [], direction) => {
      let result = y;
      yArray.forEach((existedY) => {
        if (existedY - 14 < result && existedY + 14 > result) {
          if (direction === 'right') {
            result = existedY + 14;
          } else {
            result = existedY - 14;
          }
        }
      });
      return result;
    };

    const getOriginPoints = (source, center, l) => {
      // console.log(source, center, l)

      let a = {
        x: 0,
        y: 0,
      };
      var dx = (center.x - source.x) / l;
      var dy = (center.y - source.y) / l;
      a.x = center.x + l * dx;
      a.y = center.y + l * dy;

      // a.x = source.x > center.x ? center.x + l * dx : center.x - l * dx
      // a.y = source.y > center.y ? center.y + l * dy : center.y - l * dy

      // console.log("origin==", a);
      return a;
    };

    const options = {
      plugins: {
        legend: {
          display: true,
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    };

    const plugins = [
      {
        id: 'ouilarue',
        afterDraw: (chart) => {
          const ctx = chart.ctx;
          // console.log("chart==", chart.config._config)
          const extremeX = { left: -1, right: -1 };
          const extremeY = { top: -1, bottom: -1 };
          ctx.save();
          ctx.font = "10px 'Averta Std CY'";
          const leftLabelCoordinates = [];
          const rightLabelCoordinates = [];
          const chartCenterPoint = {
            x:
              (chart.chartArea.right - chart.chartArea.left) / 2 +
              chart.chartArea.left,
            y:
              (chart.chartArea.bottom - chart.chartArea.top) / 2 +
              chart.chartArea.top,
          };
          chart.config.data.labels.forEach((label, i) => {
            /* console.log(chart.config._config.data.datasets[0].backgroundColor[i]) */
            const meta = chart.getDatasetMeta(0);
            const arc = meta.data[i];
            const dataset = chart.config.data.datasets[0];

            // Prepare data to draw
            // important point 1
            const centerPoint = arc.getCenterPoint();
            //console.log("arc==", arc.outerRadius)
            // const model = arc._model;
            let color =
              chart.config._config.data.datasets[0].backgroundColor[i]; //"red";//model.borderColor;
            let labelColor =
              chart.config._config.data.datasets[0].backgroundColor[i]; //"red";//model.borderColor;
            // if (dataset.polyline && dataset.polyline.color) {
            //   color = dataset.polyline.color;
            // }

            // if (dataset.polyline && dataset.polyline.labelColor) {
            //   labelColor = "#000"//dataset.polyline.labelColor;
            // }

            const angle = Math.atan2(
              centerPoint.y - chartCenterPoint.y,
              centerPoint.x - chartCenterPoint.x
            );
            // important point 2, this point overlapsed with existed points
            // so we will reduce y by 14 if it's on the right
            // or add by 14 if it's on the left
            let originPoint = getOriginPoints(
              chartCenterPoint,
              centerPoint,
              arc.outerRadius
            );
            const point2X =
              chartCenterPoint.x +
              Math.cos(angle) *
                (centerPoint.x < chartCenterPoint.x
                  ? arc.outerRadius + 10
                  : arc.outerRadius + 10);
            let point2Y =
              chartCenterPoint.y +
              Math.sin(angle) *
                (centerPoint.y < chartCenterPoint.y
                  ? arc.outerRadius + 15
                  : arc.outerRadius + 15);

            let suitableY;
            if (point2X < chartCenterPoint.x) {
              // on the left
              suitableY = getSuitableY(point2Y, leftLabelCoordinates, 'left');
            } else {
              // on the right

              suitableY = getSuitableY(point2Y, rightLabelCoordinates, 'right');
            }

            point2Y = suitableY;

            let value = dataset.data[i];
            // if (dataset.polyline && dataset.polyline.formatter) {
            //   value = dataset.polyline.formatter(value);
            // }
            let edgePointX =
              point2X < chartCenterPoint.x
                ? chartCenterPoint.x - arc.outerRadius - 10
                : chartCenterPoint.x + arc.outerRadius + 10;

            if (point2X < chartCenterPoint.x) {
              leftLabelCoordinates.push(point2Y);
            } else {
              rightLabelCoordinates.push(point2Y);
            }

            //DRAW CODE
            // first line: connect between arc's center point and outside point
            ctx.lineWidth = 2;
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(originPoint.x, originPoint.y);
            ctx.lineTo(point2X, point2Y);
            ctx.stroke();
            // second line: connect between outside point and chart's edge
            ctx.beginPath();
            ctx.moveTo(point2X, point2Y);
            ctx.lineTo(edgePointX, point2Y);
            ctx.stroke();
            //fill custom label
            const labelAlignStyle =
              edgePointX < chartCenterPoint.x ? 'right' : 'left';
            const labelX = edgePointX;
            const labelY = point2Y + 7;
            ctx.textAlign = labelAlignStyle;
            ctx.textBaseline = 'bottom';
            ctx.font = 'bold 12px Lato';
            // ctx.fillStyle = labelColor;
            ctx.fillText(label, edgePointX, labelY);
            const metrics = ctx.measureText(label);
            const labelWidth = metrics.width;
            const labelHeight =
              metrics.actualBoundingBoxAscent +
              metrics.actualBoundingBoxDescent;

            if (labelAlignStyle === 'left') {
              extremeX.right = Math.max(extremeX.right, labelX + labelWidth);
            } else if (labelAlignStyle === 'right') {
              extremeX.left =
                extremeX.left === -1 || labelX - labelWidth < extremeX.left
                  ? labelX - labelWidth
                  : extremeX.left;
            }
            extremeY.bottom = Math.max(extremeY.bottom, labelY);
            extremeY.top =
              extremeY.top === -1 || labelY < extremeY.top
                ? labelY - labelHeight
                : extremeY.top;
          });
          // Calculate new chart dimensions
          const newChartWidth = Math.max(
            extremeX['right'] - extremeX['left'],
            chart.width
          );
          const newChartHeight = Math.max(extremeY['bottom'], chart.height);

          // Get container dimensions
          const container = chart.canvas.parentNode;
          const containerWidth = container.offsetWidth;
          const containerHeight = container.offsetHeight;
          const yRatio = containerHeight / newChartHeight;
          const xRatio = containerWidth / newChartWidth;
          chart.resize(0.3 * containerWidth, 0.3 * containerHeight);
          // Choose the smaller of the two ratios to ensure the chart fits inside the container
          const ratio = Math.min(xRatio, yRatio);
          // Resize the chart based on the chosen ratio
          //chart.resize(newChartWidth * ratio, newChartHeight * ratio);
          //chart.resize(containerWidth, 200);
        },
      },
    ];

    var myChart = new Chart(ctx, {
      type: 'pie',
      plugins: plugins,
      options: options,
      data: {
        labels: [
          'Red',
          'Blue',
          'Yellow',
          'zhefuhzghiqofhbdgqg',
          'Greek',
          'Greek',
        ],
        datasets: [
          {
            label: '# of Votes',
            data: [5, 1, 0.4, 2, 0.3, 10],
            weight: 12,
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(255, 159, 64, 0.8)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(75, 192, 192, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
    });
    myChart.resize(100, 100);
  }
}

bootstrapApplication(App);
