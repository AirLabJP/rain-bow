// 位置情報を取得する関数
function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        positionSuccess,
        positionError,
        { enableHighAccuracy: true }
      );
    } else {
      showError("位置情報がサポートされていないブラウザです。");
    }
  }
  
  // 位置情報の取得に成功した場合の処理
  function positionSuccess(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    
    // 位置情報をセッションストレージに保存
    sessionStorage.setItem('userLatitude', latitude);
    sessionStorage.setItem('userLongitude', longitude);
    
    // 位置情報をサーバーに送信し、天気情報をチェック
    checkWeatherConditions(latitude, longitude);
  }
  
  // 位置情報の取得に失敗した場合の処理
  function positionError(error) {
    let errorMessage;
    
    switch(error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "位置情報の利用が許可されていません。";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "現在の位置情報が取得できません。";
        break;
      case error.TIMEOUT:
        errorMessage = "位置情報の取得がタイムアウトしました。";
        break;
      case error.UNKNOWN_ERROR:
        errorMessage = "不明なエラーが発生しました。";
        break;
    }
    
    showError(errorMessage);
  }
  
  // エラーメッセージを表示
  function showError(message) {
    console.error(message);
    // ユーザーに表示するエラーメッセージ
    const errorElement = document.getElementById('location-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }
  
  // 天気情報をチェックするAPIを呼び出す
  function checkWeatherConditions(latitude, longitude) {
    fetch(`/api/weather?lat=${latitude}&lon=${longitude}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log('天気情報を取得しました:', data);
      
      if (data.rainbow_possible) {
        // 虹が出る可能性があれば通知を表示
        sendRainbowNotification();
      }
    })
    .catch(error => {
      console.error('天気情報の取得中にエラーが発生しました:', error);
    });
  }
  
  // 虹が出る可能性がある場合の通知
  function sendRainbowNotification() {
    if ("Notification" in window) {
      // 通知の許可がまだ得られていない場合、許可を要求
      if (Notification.permission !== "granted") {
        Notification.requestPermission();
      }
      
      if (Notification.permission === "granted") {
        // Push.jsを使用して通知を送信
        Push.create("虹が出ているかもしれません！", {
          body: "空を見てみましょう！今、虹が見える気象条件が整っています。",
          icon: '/rainbow_icon.png',
          timeout: 8000,
          onClick: function () {
            window.focus();
            this.close();
          }
        });
      }
    }
  }
  
  // ページ読み込み時に位置情報の取得を開始
  document.addEventListener('DOMContentLoaded', function() {
    // アプリ起動時に位置情報を取得
    getLocation();
    
    // 定期的に位置情報と天気をチェック（15分ごと）
    setInterval(getLocation, 15 * 60 * 1000);
    
    // 位置情報の再取得ボタンのイベントリスナーを設定
    const refreshButton = document.getElementById('refresh-location');
    if (refreshButton) {
      refreshButton.addEventListener('click', getLocation);
    }
  });
  
  export { getLocation, sendRainbowNotification };