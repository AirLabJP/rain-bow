// 位置情報を取得する関数
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      positionSuccess,
      positionError,
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5分間はキャッシュを使用
      }
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
      errorMessage = "位置情報の利用が許可されていません。ブラウザの設定で位置情報を許可してください。";
      break;
    case error.POSITION_UNAVAILABLE:
      errorMessage = "現在の位置情報が取得できません。接続環境を確認してください。";
      break;
    case error.TIMEOUT:
      errorMessage = "位置情報の取得がタイムアウトしました。再度お試しください。";
      break;
    default:
      errorMessage = "不明なエラーが発生しました。";
      break;
  }
  
  showError(errorMessage);
  updateStatus('位置情報の取得に失敗しました');
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

// ステータスメッセージを更新
function updateStatus(message) {
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.textContent = message;
  }
}

// 天気情報をチェックするAPIを呼び出す
function checkWeatherConditions(latitude, longitude) {
  updateStatus('天気情報を取得中...');
  
  fetch(`/api/weather?lat=${latitude}&lon=${longitude}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
      // GETリクエストにはCSRFトークンは不要
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTPエラー: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('天気情報を取得しました:', data);
    
    if (data.error) {
      showError(data.error);
      updateStatus('天気情報の取得に失敗しました');
      return;
    }
    
    // 現在の天気を表示
    const weatherInfo = data.current_weather;
    updateStatus(
      `位置情報の取得に成功しました。現在の天気: ${weatherInfo.weather_description} (${weatherInfo.city_name})`
    );
    
    if (data.rainbow_possible) {
      // 虹が出る可能性があれば通知を表示
      sendRainbowNotification(data.message);
    }
  })
  .catch(error => {
    console.error('天気情報の取得中にエラーが発生しました:', error);
    showError('天気情報の取得に失敗しました。しばらくしてから再度お試しください。');
    updateStatus('天気情報の取得に失敗しました');
  });
}

// 虹が出る可能性がある場合の通知
function sendRainbowNotification(message = "虹が出ているかもしれません！") {
  // Pushライブラリが読み込まれているか確認
  if (typeof Push === 'undefined') {
    console.error('Push.jsが読み込まれていません');
    return;
  }
  
  // 通知の許可状態を確認
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      // 既に許可されている場合は通知を表示
      showNotification(message);
    } else if (Notification.permission !== "denied") {
      // 未決定の場合は許可を要求してから通知
      Notification.requestPermission().then(function (permission) {
        if (permission === "granted") {
          showNotification(message);
        }
      });
    }
  }
}

// 通知を表示
function showNotification(message) {
  Push.create("虹が出ているかもしれません！", {
    body: message || "空を見てみましょう！今、虹が見える気象条件が整っています。",
    icon: '/rainbow_icon.png',
    timeout: 8000,
    onClick: function () {
      window.focus();
      this.close();
    }
  });
}

// ページ読み込み時のイベントリスナー設定
document.addEventListener('DOMContentLoaded', function() {
  // 通知許可ボタンのイベントリスナー（最初はユーザーの明示的な操作で許可を求める）
  const enableNotificationBtn = document.getElementById('enable-notification');
  if (enableNotificationBtn) {
    enableNotificationBtn.addEventListener('click', function() {
      if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission().then(function(permission) {
          if (permission === "granted") {
            alert("通知が有効になりました！虹が出る条件が揃ったときにお知らせします。");
            enableNotificationBtn.style.display = 'none';
          }
        });
      }
    });
  }
  
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
