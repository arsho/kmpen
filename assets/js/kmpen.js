const CHART_COLORS = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
};

function getRandomInt(min_value, max_value) {
    min_value = Math.ceil(min_value);
    max_value = Math.floor(max_value);
    return Math.floor(Math.random() * (max_value - min_value + 1) + min_value);
}

function getRandomColors() {
    const r = getRandomInt(0, 255);
    const g = getRandomInt(0, 255);
    const b = getRandomInt(0, 255);
    return "rgba(" + r + "," + g + "," + b + ", 1.0)";
}

function get_pdf_size(points, unit) {
    // Unit table from https://github.com/MrRio/jsPDF/blob/ddbfc0f0250ca908f8061a72fa057116b7613e78/jspdf.js#L791
    var multiplier;
    switch (unit) {
        case 'pt':
            multiplier = 1;
            break;
        case 'mm':
            multiplier = 72 / 25.4;
            break;
        case 'cm':
            multiplier = 72 / 2.54;
            break;
        case 'in':
            multiplier = 72;
            break;
        case 'px':
            multiplier = 96 / 72;
            break;
        case 'pc':
            multiplier = 12;
            break;
        case 'em':
            multiplier = 12;
            break;
        case 'ex':
            multiplier = 6;
        default:
            throw ('Invalid unit: ' + unit);
    }
    return points * multiplier;
}


$(document).ready(function () {
    $(window).scroll(function () {
        if ($(this).scrollTop() > 50) {
            $('#back-to-top').fadeIn();
        } else {
            $('#back-to-top').fadeOut();
        }
    });
    // scroll body to 0px on click
    $('#back-to-top').on("click", function () {
        $('body,html').animate({
            scrollTop: 0
        }, 400);
        return false;
    });
    $("#container").show();
    $("#graph").hide();

    function get_file_data(datafile) {
        var dataset = {};
        $.ajax({
            url: '../datafiles/' + datafile,
            type: "GET",
            async: false,
            success: function (data) {
                let lines = data.split("\n");
                if (lines.length > 2) {
                    for (let i = 1; i < lines.length; i++) {
                        let line = lines[i].trim();
                        if (line !== "") {
                            let current_data = line.split("\t");
                            if (current_data !== "") {
                                let row = {};
                                row.barcode = current_data[0];
                                row.time = parseInt(current_data[1]);
                                if (row.time < 0) {
                                    continue;
                                }
                                row.status = parseInt(current_data[2]);
                                row.a1bg = current_data[3];
                                row.group1 = current_data[4];
                                row.group2 = current_data[5];
                                const group = row.group1 + " + " + row.group2;
                                if (!dataset.hasOwnProperty(group)) {
                                    dataset[group] = [];
                                }
                                dataset[group].push(row);
                            }
                        }
                    }
                }
            },
        });
        return dataset;
    }


    function get_dataset(dataset_type) {
        var dataset = {};
        let datafile;
        // data: Time, Group/Factor, Outcome/Censor
// A1BG-S-KMinput.txt  : is tab separated file. It has following columns.
// 1.       Barcode: Patient ID
// 2.       Time: Time in days
// 3.       Status: patient life status (death=0, alive=1)
// 4.       A1BG: Expression value of A1BG gene in cancer patients
// 5.       ExpressionLevel:  is Group1, dividing patients based on A1BG expression level
// 6.       Sex: id Group2, dividing patients based on patient’s gender
//
// A1BG-R-KMinput.txt  : is tab separated file. It has following columns.
// 1.       Barcode: Patient ID
// 2.       Time: Time in days
// 3.       Status: patient life status (death=0, alive=1)
// 4.       A1BG: Expression value of A1BG gene in cancer patients
// 5.       ExpressionLevel:  is Group1, dividing patients based on A1BG expression level
// 6.       Race: id Group2, dividing patients based on patient’s race


        if (dataset_type === "race_dataset") {
            datafile = 'A1BG-R-KMinput.txt';
        } else if (dataset_type === "gender_dataset") {
            datafile = 'A1BG-S-KMinput.txt';
        }
        return get_file_data(datafile);
    }

    function get_km_data(dataset) {
        let time_flag = {};
        let normal_data = [];
        let censor_data = [];
        let number_of_alive = dataset.length;
        let current_probability = 1.0;
        normal_data.push({
            "x": 0,
            "y": current_probability
        });
        for (let i = 0; i < dataset.length; i++) {
            const current_time = dataset[i].time;
            const censor = dataset[i].status;
            normal_data.push({
                "x": current_time,
                "y": current_probability
            });
            let death_count = 0;
            if (censor === 1) {
                if (time_flag[current_time]) {
                    continue;
                } else {
                    time_flag[current_time] = true;
                    for (let j = i; j < dataset.length; j++) {
                        if (dataset[j].time !== current_time) {
                            break;
                        } else if (dataset[j].status === 1) {
                            death_count++;
                        }
                    }
                    current_probability = current_probability * (1.0 - (death_count / number_of_alive));
                    number_of_alive -= death_count;
                }
            } else {
                number_of_alive--;
                censor_data.push({
                    "x": current_time,
                    "y": current_probability
                });
            }
            normal_data.push({
                "x": current_time,
                "y": current_probability
            });

        }
        return {"normal_data": normal_data, "censor_data": censor_data};
    }

    function show_data(datasets) {

        let empty_tables = '<div class="row">';
        for (let i = 0; i < datasets.length; i++) {
            let id = "datatable_" + i;
            empty_tables += '<div class="col-12 col-md-6 mb-4">';
            empty_tables += '<table id="' + id + '" class="table table-sm table-bordered table-striped caption-top table-responsive-md">';
            empty_tables += '<caption class="card-subtitle text-center p-2 mb-2 bg-dark bg-gradient text-white">';
            empty_tables += 'Dataset: ' + parseInt(i + 1);
            empty_tables += '</caption>';
            empty_tables += '<thead class="table-light">';
            empty_tables += '<tr>';
            empty_tables += '    <th>Subject</th>';
            empty_tables += '    <th>Time</th>';
            empty_tables += '    <th>Group</th>';
            empty_tables += '    <th>Censor</th>';
            empty_tables += '</tr>';
            empty_tables += '</thead>';
            empty_tables += '<tbody>';
            empty_tables += '</tbody>';
            empty_tables += '</table>';
            empty_tables += '</div>';
        }
        empty_tables += '</div>';

        $("#data_tables").html(empty_tables);

        for (let i = 0; i < datasets.length; i++) {
            let dataset = datasets[i];
            let id = "datatable_" + i;
            var data_with_index = [];
            for (let i = 0; i < dataset.length; i++) {
                let current_row = [i + 1];
                for (let j = 0; j < dataset[i].length; j++) {
                    current_row.push(dataset[i][j]);
                }
                data_with_index.push(current_row);
            }
            var table = $('#' + id).DataTable();
            table.clear();
            table.rows.add(data_with_index).draw();
        }
    }

    function show_graph(datasets) {
        let chart_data = [];
        let default_colors = [CHART_COLORS.green, CHART_COLORS.red,
            CHART_COLORS.purple, CHART_COLORS.blue,
            CHART_COLORS.yellow, CHART_COLORS.orange];

        for (const group in datasets) {
            let dataset = datasets[group];
            let km_data = get_km_data(dataset);
            let normal_data = km_data["normal_data"];
            let censor_data = km_data["censor_data"];
            let color_1, color_2;
            if (datasets.length <= 3) {
                color_1 = default_colors[i * 2];
                color_2 = default_colors[i * 2 + 1];
            } else {
                color_1 = getRandomColors();
                color_2 = getRandomColors();
            }
            const line_chart_data = {
                type: 'line',
                label: group,
                backgroundColor: color_1,
                borderColor: color_1,
                data: normal_data,
                fill: false,
                stepped: 'after',
                radius: 0,
                hitRadius: 0,
                borderWidth: 3,
            };
            const scatter_chart_data = {
                type: 'scatter',
                label: group + ' - Censored',
                backgroundColor: color_1,
                borderColor: color_1,
                data: censor_data,
                radius: 7,
                hoverRadius: 7,
                borderWidth: 3,
                hoverBorderWidth: 3,
                pointStyle: 'cross',
            };
            chart_data.push(scatter_chart_data);
            chart_data.push(line_chart_data);
        }


        const canvas_background_plugin = {
            id: 'custom_canvas_background_color',
            beforeDraw: (chart) => {
                const ctx = chart.canvas.getContext('2d');
                ctx.save();
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
            }
        };

        const config = {
            data: {datasets: chart_data},
            options: {
                plugins: {
                    legend: {
                        labels: {
                            usePointStyle: true,
                        },
                    }
                },
                animation: false,
                responsive: true,
                scales: {
                    x: {
                        type: 'linear',
                        beginAtZero: true,
                        grace: '0%',
                        title: {
                            display: true,
                            align: 'center',
                            text: 'Time (days)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        min: 0.0,
                        max: 1.1,
                        ticks: {
                            stepSize: 0.1 // this worked as expected
                        },
                        title: {
                            display: true,
                            align: 'center',
                            text: 'Survival Probability'
                        }
                    }
                },
            },
            plugins: [canvas_background_plugin],
        };
        Chart.defaults.color = '#000';
        const ctx = document.getElementById('kmgraph').getContext('2d');

        const old_chart = Chart.getChart(ctx);
        if (typeof old_chart !== 'undefined') {
            old_chart.destroy();
        }
        new Chart(ctx, config);

    }

    $(".graph_data_btn").on("click", function () {
        $("#graph").hide();
        const id = $(this).attr("id");
        let dataset, dataset_label;
        if (id === "race_dataset") {
            dataset = get_dataset("race_dataset");
            dataset_label = ": Dataset from Race";
        } else if (id === "gender_dataset") {
            dataset = get_dataset("gender_dataset");
            dataset_label = ": Dataset from Gender";
        }
        $("#dataset_label").html(dataset_label);
        // show_data(dataset);
        show_graph(dataset);
        $("#graph").show("slow");
    });


    $(".download_chart").on("click", function () {
        const id = $(this).attr("id");
        let canvas_data, filename;
        const ctx = document.getElementById('kmgraph').getContext('2d');
        const current_chart = Chart.getChart(ctx);
        if (typeof current_chart !== 'undefined') {
            if (id === "jpeg_btn") {
                canvas_data = current_chart.toBase64Image('image/jpeg', 1);
                filename = "km_graph.jpg";
            } else if (id === "png_btn") {
                canvas_data = current_chart.toBase64Image();
                filename = "km_graph.png";
            } else if (id === "pdf_btn") {
                const aspect_ratio = current_chart.width / current_chart.height;
                filename = "km_graph.pdf";
                var pdf = new jsPDF('p', 'pt', 'a4');
                const pdf_width = pdf.internal.pageSize.width;
                const pdf_max_width = get_pdf_size(pdf_width, 'px') - 0;
                if (current_chart.width > pdf_max_width) {
                    current_chart.resize(pdf_max_width, pdf_max_width * (1 / aspect_ratio));
                }
                canvas_data = current_chart.toBase64Image();
                pdf.addImage(canvas_data, 'PNG', 0, 20);
                pdf.save(filename);
                current_chart.resize();
            }
        }
        if (id !== "pdf_btn") {
            let temp_link = document.createElement('a');
            temp_link.href = canvas_data;
            temp_link.download = filename;
            temp_link.click();
        }
    });

});