//Reload on Logo Click
$('#header>img').click(() => {
    location.reload();
});

//터치 확대 제거
document.addEventListener("touchmove", function(e) {
    e.preventDefault();
  }, { passive: false });
  
//Send Data to PLC
let dataToSend = [];
function writeData(value) {
    console.log("보낸 데이터: " + dataToSend);
    $.ajax({
        url: `${value}`,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ "data": `${dataToSend}`, "offset": `${Offset_value}` }),
        success: function (response) {
            if (response.status == "err") {
                modal();
                $('.modal_content').html(`에러코드: ${response.error}`);
            } else if (response.status == "success") {
                console.log('데이터를 성공적으로 보냈습니다.');
            }

            //$("#responseDiv").text("Response from PLC: " + response);
        },
        error: function (xhr, status, error) {
            modal();
            $('.modal_content').html(`에러코드: ${error}`);
            //$("#responseDiv").text("Failed to send data to PLC");
        }
    });
}

//arrayDecomposition
let temp_array = [];
function arrayDecomposition(value) {
    temp_array = value.split(',');
    dataToSend = temp_array.map(Number);
}

//data send btn
let temp_dataToSend = "";
let Offset_value = 0;
$('#writeRegister').on('click', () => {
    temp_dataToSend = $("#Data_To_PLC").val();
    Offset_value = $('#Offset_To_PLC').val();
    arrayDecomposition(temp_dataToSend);
    writeData('/writeRegister');
    //console.log("offset :" + Offset_value);
    //console.log("send data :" + dataToSend);
});

$('#writeCoil').on('click', () => {
    temp_dataToSend = $("#Data_To_PLC").val();
    Offset_value = $('#Offset_To_PLC').val();
    arrayDecomposition(temp_dataToSend);
    writeData('/writeCoil');
    //console.log("offset :" + Offset_value);
    //console.log("send data :" + dataToSend);
});



//modal
$('.modal').hide();
function modal() {
    $('.modal').show();
    $('.modal').addClass('active');
    $('.modal_background').show();
}

//modal close
$(document).ready(function () {
    $('.xi-close-min').click(function () {
        $('.modal').hide();
        $('.modal_background').hide();
        $(this).closest('.modal').removeClass('active');
        $('#modal_content').append("hello")
    });
});



//connect btn
function connect_PLC(value1, value2) {
    $.ajax({
        url: "/connect",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ "ip_value": `${value1}`, "port_value": value2 }),
        success: function (response) {

            //modal, light success/false alert
            if (response.current) {
                $('.status_light').css("background-color", 'lightgreen');
                $('.current_status>.comment').text(`IP : ${response.ip} PORT: ${response.port}`);
            } else {
                $('.status_light').css("background-color", 'red');
                $('.modal_content').html(`${response.comment}`);
                $('.current_status > .comment').text("");
                modal();
            }
        },
        error: function (xhr, status, error) {
            console.log(error);
        }
    });
}

//Connectiong To PLC BTN
//문자 숫자로 인해 에러가 발생 할 수 있음 확인!
$('#connectBtn').on("click", () => {
    let ip_value = $('#IP_Address').val();
    let port_value = $('#Use_Port').val();
    connect_PLC(ip_value, port_value);
});


//Receiving Data BTN
let receivingAddress = 0;
let receivingLength = 0;
let liveDataBox = $('.live_data_box');
const currentTime = new Date();
const hours = currentTime.getHours();
const minutes = currentTime.getMinutes();
const seconds = currentTime.getSeconds();
const year = currentTime.getFullYear();
const month = currentTime.getMonth() + 1;
const day = currentTime.getDate()

$('#startReceivingData').on("click", () => {
    receivingAddress = $('#receivingStartAddr').val();
    receivingLength = $('#receivingLen').val();
    $.ajax({
        url: "/startReceivingData",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ "receivingAddress": receivingAddress, "receivingLength": receivingLength }),
        //response를 바로 사용하면 요청-응답 방식
        success: function (response) {
            console.log(response);
            console.log("PLC 데이터 받아오기 성공");
            //서버가 클라이언트에게 데이터를 발송하며, 자동으로 데이터가 받아지는 방식
            const eventSource = new EventSource('/data-stream');
            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log(`받은 데이터: ${data}`);
                $('.live_data_box').html(
                    `현재 날짜: ${year}-${month}-${day}<br>
                    현재 시간: ${hours}:${minutes}:${seconds}<br>
                    받은 데이터: ${data}`
                );
                //받아온 현재 시간도 넣기
                //PLC에서 데이터 넘어오는지 확인, 데이터가 수시로 바뀌는지도 확인
            }
        },
        error: function (xhr, status, error) {
            console.log('에러입니다');
            $('.live_data_box').prepend(
                `현재 날짜: ${year}-${month}-${day}<br>
                현재 시간: ${hours}:${minutes}:${seconds}<br>
                현재 상태: 연결 끊김<br><br>`
            );
        }
    });
});


