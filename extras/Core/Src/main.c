/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
  * @brief          : Main program body with MQTT support
  ******************************************************************************
  */
/* USER CODE END Header */
/* Includes ------------------------------------------------------------------*/
#include "main.h"

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */

/* USER CODE END Includes */

/* Private typedef -----------------------------------------------------------*/
/* USER CODE BEGIN PTD */

/* USER CODE END PTD */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */
#define ESP_UART huart1
#define ENABLE_USER_LOG 1
#define DISABLE_USER_LOG 0
#define ESP_RX_BUFFER_SIZE 512
#define MQTT_PACKET_SIZE 256

#if ENABLE_USER_LOG
#define USER_LOG(fmt, ...) printf("[USER] " fmt "\r\n", ##__VA_ARGS__)
#else
#define USER_LOG(fmt, ...)
#endif

#define LSM303DLHC_ACC_ADDR     (0x19 << 1)
#define LSM303_CTRL_REG1_A      0x20
#define LSM303_CTRL_REG4_A      0x23
#define LSM303_OUT_X_L_A        0x28
/* USER CODE END PD */

/* Private macro -------------------------------------------------------------*/
/* USER CODE BEGIN PM */
#if ENABLE_USER_LOG
#define DEBUG_LOG(fmt, ...) printf(fmt "\r\n", ##__VA_ARGS__)
#else
#define DEBUG_LOG(fmt, ...)
#endif

/* USER CODE END PM */

/* Private variables ---------------------------------------------------------*/
I2C_HandleTypeDef hi2c1;

SPI_HandleTypeDef hspi1;

TIM_HandleTypeDef htim2;

UART_HandleTypeDef huart1;
UART_HandleTypeDef huart2;

PCD_HandleTypeDef hpcd_USB_FS;

/* USER CODE BEGIN PV */
char esp_rx_buffer[ESP_RX_BUFFER_SIZE];
uint8_t mqtt_packet[MQTT_PACKET_SIZE];

volatile uint32_t step_count = 0;
float filtered_accel = 0;
float prev_filtered_accel = 0;
uint8_t step_detected = 0;
uint32_t last_step_time = 0;
/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_I2C1_Init(void);
static void MX_SPI1_Init(void);
static void MX_USB_PCD_Init(void);
static void MX_USART1_UART_Init(void);
static void MX_USART2_UART_Init(void);
static void MX_TIM2_Init(void);
/* USER CODE BEGIN PFP */

/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */
static int ESP_SendCommand(const char* command, const char* ack, uint32_t timeout)
{
    uint8_t ch = 0;
    uint16_t idx = 0;
    uint32_t tickstart;
    int found = 0;

    memset(esp_rx_buffer, 0, sizeof(esp_rx_buffer));
    tickstart = HAL_GetTick();

    if (strlen(command) > 0)
    {
        DEBUG_LOG("Sending: %s", command);
        if (HAL_UART_Transmit(&huart1, (uint8_t*)command, strlen(command), HAL_MAX_DELAY) != HAL_OK)
        {
            DEBUG_LOG("Transmission failed");
            return 0;
        }
    }

    while((HAL_GetTick() - tickstart) < timeout && idx < sizeof(esp_rx_buffer) - 1)
    {
        if(HAL_UART_Receive(&huart1, &ch, 1, 10) == HAL_OK)
        {
            esp_rx_buffer[idx++] = ch;
            esp_rx_buffer[idx] = '\0';

            // Check for acknowledgment
            if (!found && strstr(esp_rx_buffer, ack))
            {
                DEBUG_LOG("Matched ACK: %s", ack);
                found = 1;
            }

            // Handle busy response
            if(strstr(esp_rx_buffer, "busy"))
            {
                DEBUG_LOG("ESP is busy, waiting...");
                HAL_Delay(1500);
                idx = 0;
                memset(esp_rx_buffer, 0, sizeof(esp_rx_buffer));
                tickstart = HAL_GetTick(); // Reset timeout
                continue;
            }
        }
    }

    if (found)
    {
        DEBUG_LOG("Response: %s", esp_rx_buffer);
    }
    else
    {
        DEBUG_LOG("Timeout or ACK not received");
    }

    return found;
}

static int ESP_SendBinary(const uint8_t* data, uint16_t len, const char* ack, uint32_t timeout)
{
    uint8_t ch = 0;
    uint16_t idx = 0;
    uint32_t tickstart;
    int found = 0;

    memset(esp_rx_buffer, 0, sizeof(esp_rx_buffer));
    tickstart = HAL_GetTick();

    // Send binary data
    if (HAL_UART_Transmit(&huart1, (uint8_t*)data, len, HAL_MAX_DELAY) != HAL_OK)
    {
        DEBUG_LOG("Binary transmission failed");
        return 0;
    }

    // Wait for acknowledgment
    while((HAL_GetTick() - tickstart) < timeout && idx < sizeof(esp_rx_buffer) - 1)
    {
        if(HAL_UART_Receive(&huart1, &ch, 1, 10) == HAL_OK)
        {
            esp_rx_buffer[idx++] = ch;
            esp_rx_buffer[idx] = '\0';

            // Check for binary acknowledgment (CONNACK starts with 0x20)
            if (!found && (strchr(esp_rx_buffer, ack[0]) != NULL))
            {
                DEBUG_LOG("Binary ACK received");
                found = 1;
            }

            if(strstr(esp_rx_buffer, "SEND OK"))
            {
                DEBUG_LOG("SEND OK received");
                if (found) break;
            }
        }
    }

    return found;
}

static int MQTT_BuildConnect(uint8_t *packet, const char *clientID, const char *username, const char *password, uint16_t keepalive)
{
    int len = 0;
    /* Fixed Header */
    packet[len++] = 0x10;   // CONNECT packet type
    int remLenPos = len++;  // Remaining length placeholder

    /* Variable Header */
    packet[len++] = 0x00; packet[len++] = 0x04;
    packet[len++] = 'M'; packet[len++] = 'Q'; packet[len++] = 'T'; packet[len++] = 'T';
    packet[len++] = 0x04;   // Protocol Level = 4 (MQTT 3.1.1)

    uint8_t connectFlags = 0x02; // Clean Session
    if (username) connectFlags |= 0x80;
    if (password) connectFlags |= 0x40;
    packet[len++] = connectFlags;

    // Keep Alive
    packet[len++] = (keepalive >> 8) & 0xFF;
    packet[len++] = (keepalive & 0xFF);

    /* Payload */
    // Client ID
    uint16_t cid_len = strlen(clientID);
    packet[len++] = cid_len >> 8;
    packet[len++] = cid_len & 0xFF;
    memcpy(&packet[len], clientID, cid_len); len += cid_len;

    // Username
    if (username) {
        uint16_t ulen = strlen(username);
        packet[len++] = ulen >> 8;
        packet[len++] = ulen & 0xFF;
        memcpy(&packet[len], username, ulen); len += ulen;
    }

    // Password
    if (password) {
        uint16_t plen = strlen(password);
        packet[len++] = plen >> 8;
        packet[len++] = plen & 0xFF;
        memcpy(&packet[len], password, plen); len += plen;
    }

    // Remaining length from Fixed Header
    packet[remLenPos] = len - 2;  // remove first 2 bytes of Fixed Header
    return len;
}

static int ESP_MQTT_Connect(const char *broker, uint16_t port, const char *clientID,
                                       const char *username, const char *password, uint16_t keepalive)
{
    char cmd[128];
    int res;
    int len;

    /****** Step 1: TCP connect ******/
    snprintf(cmd, sizeof(cmd), "AT+CIPSTART=\"TCP\",\"%s\",%d\r\n", broker, port);
    res = ESP_SendCommand(cmd, "CONNECT", 5000);
    if (!res){
        DEBUG_LOG("CIPSTART Failed..");
        return 0;
    }

    HAL_Delay(500);

    /****** Step 2: Build MQTT CONNECT packet ******/
    len = MQTT_BuildConnect(mqtt_packet, clientID, username, password, keepalive);

    /****** Step 3: Tell ESP how many bytes to send ******/
    snprintf(cmd, sizeof(cmd), "AT+CIPSEND=%d\r\n", len);
    res = ESP_SendCommand(cmd, ">", 2000);
    if (!res){
        DEBUG_LOG("CIPSEND Failed..");
        return 0;
    }

    /****** Step 4: Send packet and wait for CONNACK ******/
    res = ESP_SendBinary(mqtt_packet, len, "\x20", 5000);
    if (!res){
        DEBUG_LOG("Send Connect Command Failed..");
        USER_LOG("MQTT CONNACK failed.");
        return 0;
    }

    USER_LOG("MQTT CONNACK received, broker accepted connection.");
    return 1;
}

static int MQTT_BuildPublish(uint8_t *packet, const char *topic, const char *message, uint8_t qos)
{
    int len = 0;

    /* Fixed Header */
    packet[len++] = 0x30 | (qos << 1); // PUBLISH, QoS
    int remLenPos = len++;  // will be calculated later

    /* Variable Header */
    // Topic
    uint16_t tlen = strlen(topic);
    packet[len++] = tlen >> 8;  // store topic len
    packet[len++] = tlen & 0xFF;  // store topic len
    memcpy(&packet[len], topic, tlen); len += tlen;  // store topic

    /* Payload */
    // Message
    uint16_t mlen = strlen(message);
    memcpy(&packet[len], message, mlen); len += mlen;  // store message

    // Remaining length
    packet[remLenPos] = len - 2;  // remove first 2 bytes of Fixed Header
    return len;
}

static int ESP_MQTT_Publish(const char *topic, const char *message, uint8_t qos)
{
    char cmd[128];
    int res;
    int len;

    /****** Step 1: Build MQTT PUBLISH packet ******/
    len = MQTT_BuildPublish(mqtt_packet, topic, message, qos);

    /****** Step 2: Tell ESP how many bytes to send  ******/
    snprintf(cmd, sizeof(cmd), "AT+CIPSEND=%d\r\n", len);
    res = ESP_SendCommand(cmd, ">", 2000);
    if (!res){
        DEBUG_LOG("CIPSEND Failed..");
        return 0;
    }

    /****** Step 3: Send packet and wait for ACK ******/
    res = ESP_SendBinary(mqtt_packet, len, "SEND OK", 5000);
    if (!res){
        DEBUG_LOG("Publish Command Failed..");
        return 0;
    }

    USER_LOG("Message published successfully to topic: %s", topic);
    return 1;
}

int HTTP_ConfigureUrl(const char *url) {
    char at_cmd[64];
    uint16_t url_len = strlen(url);
    int res;

    // Step 1: Send the length and wait for the '>' prompt
    snprintf(at_cmd, sizeof(at_cmd), "AT+HTTPURLCFG=%d\r\n", url_len);
    res = ESP_SendCommand(at_cmd, ">", 2000);
    if (!res) {
        DEBUG_LOG("URL length config Failed (no prompt)");
        return 0;
    }

    // Step 2: Send the actual URL data (no \r\n at the end of the raw data)
    if (HAL_UART_Transmit(&huart1, (uint8_t*)url, url_len, HAL_MAX_DELAY) != HAL_OK) {
        DEBUG_LOG("URL transmit Failed");
        return 0;
    }

    // Step 3: Wait for "OK" (Note: some firmware versions return "SET OK", some just "OK")
    res = ESP_SendCommand("", "OK", 3000);
    if (!res) {
        DEBUG_LOG("URL data confirmation Failed");
        return 0;
    }


    USER_LOG("URL Configured Successfully!");
    return 1;
}

static int ESP_MQTT_Connect_TLS(const char *broker, uint16_t port,
                                 const char *clientID,
                                 const char *username,
                                 const char *password)
{
    char cmd[256];
    int res;

    USER_LOG("=== Starting MQTT TLS Connection ===");

    // ONLY STEP 1: Configure everything in one command
    USER_LOG("Configuring MQTT...");
    snprintf(cmd, sizeof(cmd),
             "AT+MQTTUSERCFG=0,2,\"%s\",\"%s\",\"%s\",0,0,\"\"\r\n",
             clientID, username, password);
    res = ESP_SendCommand(cmd, "OK", 3000);
    if (!res) {
        USER_LOG("MQTTUSERCFG Failed!");
        return 0;
    }
    USER_LOG("Configuration OK");
    HAL_Delay(200);


    USER_LOG("Connecting to broker...");
    snprintf(cmd, sizeof(cmd),
             "AT+MQTTCONN=0,\"%s\",%d,1\r\n",
             broker, port);
    res = ESP_SendCommand(cmd, "OK", 15000);
    if (!res) {
        USER_LOG("MQTTCONN Failed!");
        return 0;
    }
    HAL_GPIO_WritePin(GPIOE, LD6_Pin, GPIO_PIN_SET);

    USER_LOG("MQTT TLS Connected!");
    return 1;
}


static int ESP_MQTT_Publish_AT(const char *topic, const char *message, uint8_t qos) {
	char cmd[256];
	USER_LOG("Publishing to: %s", topic);
	snprintf(cmd, sizeof(cmd), "AT+MQTTPUB=0,\"%s\",\"%s\",%d,0\r\n", topic, message, qos);
	if (!ESP_SendCommand(cmd, "OK", 5000)) {
		USER_LOG("Publish failed!");
		return 0;
	}
	USER_LOG("Published successfully!");
	return 1;
}

static int LSM303_Init(void)
{
    uint8_t data[2];
    HAL_StatusTypeDef status;

    // CTRL_REG1_A: 100Hz data rate, all axes enabled
    data[0] = LSM303_CTRL_REG1_A;
    data[1] = 0x57;  // 100Hz, normal mode, XYZ enabled
    status = HAL_I2C_Master_Transmit(&hi2c1, LSM303DLHC_ACC_ADDR, data, 2, 100);
    if (status != HAL_OK) {
        USER_LOG("LSM303 CTRL_REG1 write failed");
        return 0;
    }

    // CTRL_REG4_A: +/- 2g full scale, high resolution
    data[0] = LSM303_CTRL_REG4_A;
    data[1] = 0x08;  // +/- 2g, high resolution
    status = HAL_I2C_Master_Transmit(&hi2c1, LSM303DLHC_ACC_ADDR, data, 2, 100);
    if (status != HAL_OK) {
        USER_LOG("LSM303 CTRL_REG4 write failed");
        return 0;
    }

    USER_LOG("LSM303 Accelerometer initialized");
    return 1;
}

static int LSM303_ReadAccel(int16_t *x, int16_t *y, int16_t *z)
{
    uint8_t reg = LSM303_OUT_X_L_A | 0x80;  // Auto-increment
    uint8_t buffer[6];

    if (HAL_I2C_Master_Transmit(&hi2c1, LSM303DLHC_ACC_ADDR, &reg, 1, 100) != HAL_OK) {
        return 0;
    }

    if (HAL_I2C_Master_Receive(&hi2c1, LSM303DLHC_ACC_ADDR, buffer, 6, 100) != HAL_OK) {
        return 0;
    }

    // Combine bytes (12-bit left-justified, so shift right by 4)
    *x = (int16_t)((buffer[1] << 8) | buffer[0]) >> 4;
    *y = (int16_t)((buffer[3] << 8) | buffer[2]) >> 4;
    *z = (int16_t)((buffer[5] << 8) | buffer[4]) >> 4;

    return 1;
}

static void StepCounter_Update(void)
{
    int16_t ax, ay, az;
    float magnitude;
    uint32_t current_time;

    if (!LSM303_ReadAccel(&ax, &ay, &az)) {
        // Blink LD4 if read fails
        HAL_GPIO_TogglePin(GPIOE, LD4_Pin);
        return;
    }

    //
    HAL_GPIO_TogglePin(GPIOE, LD7_Pin);
    // Calculate acceleration magnitude
    magnitude = sqrt((float)(ax*ax + ay*ay + az*az));

    // Low-pass filter to smooth the signal
    filtered_accel = 0.8f * filtered_accel + 0.2f * magnitude;

    current_time = HAL_GetTick();

    // Peak detection for step counting
    // Threshold and timing to avoid double-counting
    if (filtered_accel > 1200.0f &&                          // Above threshold
        prev_filtered_accel <= 1200.0f &&                    // Rising edge
        (current_time - last_step_time) > 250)            // Min 250ms between steps
    {
        step_count++;
        last_step_time = current_time;
        USER_LOG("Step detected! Count: %lu", step_count);

        HAL_GPIO_TogglePin(GPIOE, LD3_Pin);
    }

    prev_filtered_accel = filtered_accel;
}

void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim)
{
    if (htim->Instance == TIM2) {
        StepCounter_Update();
    }
}

/* USER CODE END 0 */

/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{

  /* USER CODE BEGIN 1 */

  /* USER CODE END 1 */

  /* MCU Configuration--------------------------------------------------------*/

  /* Reset of all peripherals, Initializes the Flash interface and the Systick. */
  HAL_Init();

  /* USER CODE BEGIN Init */

  /* USER CODE END Init */

  /* Configure the system clock */
  SystemClock_Config();

  /* USER CODE BEGIN SysInit */

  /* USER CODE END SysInit */

  /* Initialize all configured peripherals */
  MX_GPIO_Init();
  MX_I2C1_Init();
  MX_SPI1_Init();
  MX_USB_PCD_Init();
  MX_USART1_UART_Init();
  MX_USART2_UART_Init();
  MX_TIM2_Init();
  /* USER CODE BEGIN 2 */
  HAL_Delay(1000); // Wait for ESP to be ready
  ESP_SendCommand("ATE0\r\n", "OK", 2000);
  ESP_SendCommand("AT+MQTTCLEAN=0\r\n", "OK", 1000);
  HAL_Delay(500);
  LSM303_Init();
  HAL_Delay(100);
  HAL_TIM_Base_Start_IT(&htim2);
  /* USER CODE END 2 */

  /* Infinite loop */
  /* USER CODE BEGIN WHILE */
  while (1)
    {
    /* USER CODE END WHILE */

    /* USER CODE BEGIN 3 */
	    StepCounter_Update();
	    HAL_Delay(10);

	    static uint32_t last_network_check = 0;

	    // in this code i prepared MQTT over TLS, this is secure, we have username and password, i also have functions for MQTT over tcp - less safe
        if (ESP_SendCommand("AT\r\n", "OK", 2000))
        {
            HAL_GPIO_WritePin(GPIOE, GPIO_PIN_10, GPIO_PIN_SET);

            // Connect to WiFi
            if (ESP_SendCommand("AT+CWJAP=\"Hola\",\"69420112\"\r\n", "OK", 15000))
            {
                // WiFi connected successfully
                HAL_GPIO_WritePin(GPIOE, GPIO_PIN_14, GPIO_PIN_SET);
                DEBUG_LOG("WiFi connected successfully!");


                if(ESP_MQTT_Connect_TLS("9f03cca8588b48b59bb6aad74976ac95.s1.eu.hivemq.cloud",
                                        8883,
                                        "6", // change this with massheslth_clientid
                                        "fitness_app_client", // enter username for mqtt connection
                                        "#iVYhAS-2B\\\"WihRr")) // enter password for mqtt connection, if u have this character " in password use \\\"
                {
                    //HAL_GPIO_WritePin(GPIOE, LD6_Pin, GPIO_PIN_SET);

                }

                char step_msg[32];
                snprintf(step_msg, sizeof(step_msg), "%lu", step_count);

                if(ESP_MQTT_Publish_AT("sensor/steps", step_msg, 0)){
                    USER_LOG("Published steps: %lu", step_count);
                }

            }
            else
            {
                // WiFi connection failed
                HAL_GPIO_WritePin(GPIOE, GPIO_PIN_14, GPIO_PIN_RESET);
                DEBUG_LOG("WiFi connection failed!");
            }
        }
        else
        {
            HAL_GPIO_WritePin(GPIOE, GPIO_PIN_10, GPIO_PIN_RESET);
            DEBUG_LOG("ESP not responding");
        }

        HAL_Delay(5000);
    }


  /* USER CODE END 3 */
}

/**
  * @brief System Clock Configuration
  * @retval None
  */
void SystemClock_Config(void)
{
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};
  RCC_PeriphCLKInitTypeDef PeriphClkInit = {0};

  /** Initializes the RCC Oscillators according to the specified parameters
  * in the RCC_OscInitTypeDef structure.
  */
  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSI|RCC_OSCILLATORTYPE_HSE;
  RCC_OscInitStruct.HSEState = RCC_HSE_BYPASS;
  RCC_OscInitStruct.HSEPredivValue = RCC_HSE_PREDIV_DIV1;
  RCC_OscInitStruct.HSIState = RCC_HSI_ON;
  RCC_OscInitStruct.HSICalibrationValue = RCC_HSICALIBRATION_DEFAULT;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;
  RCC_OscInitStruct.PLL.PLLMUL = RCC_PLL_MUL6;
  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  /** Initializes the CPU, AHB and APB buses clocks
  */
  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                              |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV2;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_1) != HAL_OK)
  {
    Error_Handler();
  }
  PeriphClkInit.PeriphClockSelection = RCC_PERIPHCLK_USB|RCC_PERIPHCLK_USART1
                              |RCC_PERIPHCLK_USART2|RCC_PERIPHCLK_I2C1;
  PeriphClkInit.Usart1ClockSelection = RCC_USART1CLKSOURCE_PCLK2;
  PeriphClkInit.Usart2ClockSelection = RCC_USART2CLKSOURCE_PCLK1;
  PeriphClkInit.I2c1ClockSelection = RCC_I2C1CLKSOURCE_HSI;
  PeriphClkInit.USBClockSelection = RCC_USBCLKSOURCE_PLL;
  if (HAL_RCCEx_PeriphCLKConfig(&PeriphClkInit) != HAL_OK)
  {
    Error_Handler();
  }
}

/**
  * @brief I2C1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_I2C1_Init(void)
{

  /* USER CODE BEGIN I2C1_Init 0 */

  /* USER CODE END I2C1_Init 0 */

  /* USER CODE BEGIN I2C1_Init 1 */

  /* USER CODE END I2C1_Init 1 */
  hi2c1.Instance = I2C1;
  hi2c1.Init.Timing = 0x00201D2B;
  hi2c1.Init.OwnAddress1 = 0;
  hi2c1.Init.AddressingMode = I2C_ADDRESSINGMODE_7BIT;
  hi2c1.Init.DualAddressMode = I2C_DUALADDRESS_DISABLE;
  hi2c1.Init.OwnAddress2 = 0;
  hi2c1.Init.OwnAddress2Masks = I2C_OA2_NOMASK;
  hi2c1.Init.GeneralCallMode = I2C_GENERALCALL_DISABLE;
  hi2c1.Init.NoStretchMode = I2C_NOSTRETCH_DISABLE;
  if (HAL_I2C_Init(&hi2c1) != HAL_OK)
  {
    Error_Handler();
  }

  /** Configure Analogue filter
  */
  if (HAL_I2CEx_ConfigAnalogFilter(&hi2c1, I2C_ANALOGFILTER_ENABLE) != HAL_OK)
  {
    Error_Handler();
  }

  /** Configure Digital filter
  */
  if (HAL_I2CEx_ConfigDigitalFilter(&hi2c1, 0) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN I2C1_Init 2 */

  /* USER CODE END I2C1_Init 2 */

}

/**
  * @brief SPI1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_SPI1_Init(void)
{

  /* USER CODE BEGIN SPI1_Init 0 */

  /* USER CODE END SPI1_Init 0 */

  /* USER CODE BEGIN SPI1_Init 1 */

  /* USER CODE END SPI1_Init 1 */
  /* SPI1 parameter configuration*/
  hspi1.Instance = SPI1;
  hspi1.Init.Mode = SPI_MODE_MASTER;
  hspi1.Init.Direction = SPI_DIRECTION_2LINES;
  hspi1.Init.DataSize = SPI_DATASIZE_4BIT;
  hspi1.Init.CLKPolarity = SPI_POLARITY_LOW;
  hspi1.Init.CLKPhase = SPI_PHASE_1EDGE;
  hspi1.Init.NSS = SPI_NSS_SOFT;
  hspi1.Init.BaudRatePrescaler = SPI_BAUDRATEPRESCALER_4;
  hspi1.Init.FirstBit = SPI_FIRSTBIT_MSB;
  hspi1.Init.TIMode = SPI_TIMODE_DISABLE;
  hspi1.Init.CRCCalculation = SPI_CRCCALCULATION_DISABLE;
  hspi1.Init.CRCPolynomial = 7;
  hspi1.Init.CRCLength = SPI_CRC_LENGTH_DATASIZE;
  hspi1.Init.NSSPMode = SPI_NSS_PULSE_ENABLE;
  if (HAL_SPI_Init(&hspi1) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN SPI1_Init 2 */

  /* USER CODE END SPI1_Init 2 */

}

/**
  * @brief TIM2 Initialization Function
  * @param None
  * @retval None
  */
static void MX_TIM2_Init(void)
{

  /* USER CODE BEGIN TIM2_Init 0 */

  /* USER CODE END TIM2_Init 0 */

  TIM_ClockConfigTypeDef sClockSourceConfig = {0};
  TIM_MasterConfigTypeDef sMasterConfig = {0};

  /* USER CODE BEGIN TIM2_Init 1 */

  /* USER CODE END TIM2_Init 1 */
  htim2.Instance = TIM2;
  htim2.Init.Prescaler = 47999;
  htim2.Init.CounterMode = TIM_COUNTERMODE_UP;
  htim2.Init.Period = 9;
  htim2.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
  htim2.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_ENABLE;
  if (HAL_TIM_Base_Init(&htim2) != HAL_OK)
  {
    Error_Handler();
  }
  sClockSourceConfig.ClockSource = TIM_CLOCKSOURCE_INTERNAL;
  if (HAL_TIM_ConfigClockSource(&htim2, &sClockSourceConfig) != HAL_OK)
  {
    Error_Handler();
  }
  sMasterConfig.MasterOutputTrigger = TIM_TRGO_RESET;
  sMasterConfig.MasterSlaveMode = TIM_MASTERSLAVEMODE_DISABLE;
  if (HAL_TIMEx_MasterConfigSynchronization(&htim2, &sMasterConfig) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN TIM2_Init 2 */

  /* USER CODE END TIM2_Init 2 */

}

/**
  * @brief USART1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_USART1_UART_Init(void)
{

  /* USER CODE BEGIN USART1_Init 0 */

  /* USER CODE END USART1_Init 0 */

  /* USER CODE BEGIN USART1_Init 1 */

  /* USER CODE END USART1_Init 1 */
  huart1.Instance = USART1;
  huart1.Init.BaudRate = 115200;
  huart1.Init.WordLength = UART_WORDLENGTH_8B;
  huart1.Init.StopBits = UART_STOPBITS_1;
  huart1.Init.Parity = UART_PARITY_NONE;
  huart1.Init.Mode = UART_MODE_TX_RX;
  huart1.Init.HwFlowCtl = UART_HWCONTROL_NONE;
  huart1.Init.OverSampling = UART_OVERSAMPLING_16;
  huart1.Init.OneBitSampling = UART_ONE_BIT_SAMPLE_DISABLE;
  huart1.AdvancedInit.AdvFeatureInit = UART_ADVFEATURE_NO_INIT;
  if (HAL_UART_Init(&huart1) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN USART1_Init 2 */

  /* USER CODE END USART1_Init 2 */

}

/**
  * @brief USART2 Initialization Function
  * @param None
  * @retval None
  */
static void MX_USART2_UART_Init(void)
{

  /* USER CODE BEGIN USART2_Init 0 */

  /* USER CODE END USART2_Init 0 */

  /* USER CODE BEGIN USART2_Init 1 */

  /* USER CODE END USART2_Init 1 */
  huart2.Instance = USART2;
  huart2.Init.BaudRate = 115200;
  huart2.Init.WordLength = UART_WORDLENGTH_8B;
  huart2.Init.StopBits = UART_STOPBITS_1;
  huart2.Init.Parity = UART_PARITY_NONE;
  huart2.Init.Mode = UART_MODE_TX_RX;
  huart2.Init.HwFlowCtl = UART_HWCONTROL_NONE;
  huart2.Init.OverSampling = UART_OVERSAMPLING_16;
  huart2.Init.OneBitSampling = UART_ONE_BIT_SAMPLE_DISABLE;
  huart2.AdvancedInit.AdvFeatureInit = UART_ADVFEATURE_NO_INIT;
  if (HAL_UART_Init(&huart2) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN USART2_Init 2 */

  /* USER CODE END USART2_Init 2 */

}

/**
  * @brief USB Initialization Function
  * @param None
  * @retval None
  */
static void MX_USB_PCD_Init(void)
{

  /* USER CODE BEGIN USB_Init 0 */

  /* USER CODE END USB_Init 0 */

  /* USER CODE BEGIN USB_Init 1 */

  /* USER CODE END USB_Init 1 */
  hpcd_USB_FS.Instance = USB;
  hpcd_USB_FS.Init.dev_endpoints = 8;
  hpcd_USB_FS.Init.speed = PCD_SPEED_FULL;
  hpcd_USB_FS.Init.phy_itface = PCD_PHY_EMBEDDED;
  hpcd_USB_FS.Init.low_power_enable = DISABLE;
  hpcd_USB_FS.Init.battery_charging_enable = DISABLE;
  if (HAL_PCD_Init(&hpcd_USB_FS) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN USB_Init 2 */

  /* USER CODE END USB_Init 2 */

}

/**
  * @brief GPIO Initialization Function
  * @param None
  * @retval None
  */
static void MX_GPIO_Init(void)
{
  GPIO_InitTypeDef GPIO_InitStruct = {0};
  /* USER CODE BEGIN MX_GPIO_Init_1 */

  /* USER CODE END MX_GPIO_Init_1 */

  /* GPIO Ports Clock Enable */
  __HAL_RCC_GPIOE_CLK_ENABLE();
  __HAL_RCC_GPIOC_CLK_ENABLE();
  __HAL_RCC_GPIOF_CLK_ENABLE();
  __HAL_RCC_GPIOA_CLK_ENABLE();
  __HAL_RCC_GPIOD_CLK_ENABLE();
  __HAL_RCC_GPIOB_CLK_ENABLE();

  /*Configure GPIO pin Output Level */
  HAL_GPIO_WritePin(GPIOE, CS_I2C_SPI_Pin|LD4_Pin|LD3_Pin|GPIO_PIN_10
                          |LD7_Pin|LD9_Pin|LD10_Pin|LD8_Pin
                          |LD6_Pin, GPIO_PIN_RESET);

  /*Configure GPIO pins : DRDY_Pin MEMS_INT3_Pin MEMS_INT4_Pin MEMS_INT1_Pin
                           MEMS_INT2_Pin */
  GPIO_InitStruct.Pin = DRDY_Pin|MEMS_INT3_Pin|MEMS_INT4_Pin|MEMS_INT1_Pin
                          |MEMS_INT2_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_EVT_RISING;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(GPIOE, &GPIO_InitStruct);

  /*Configure GPIO pins : CS_I2C_SPI_Pin LD4_Pin LD3_Pin PE10
                           LD7_Pin LD9_Pin LD10_Pin LD8_Pin
                           LD6_Pin */
  GPIO_InitStruct.Pin = CS_I2C_SPI_Pin|LD4_Pin|LD3_Pin|GPIO_PIN_10
                          |LD7_Pin|LD9_Pin|LD10_Pin|LD8_Pin
                          |LD6_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOE, &GPIO_InitStruct);

  /*Configure GPIO pin : B1_Pin */
  GPIO_InitStruct.Pin = B1_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(B1_GPIO_Port, &GPIO_InitStruct);

  /* USER CODE BEGIN MX_GPIO_Init_2 */

  /* USER CODE END MX_GPIO_Init_2 */
}

/* USER CODE BEGIN 4 */

/* USER CODE END 4 */

/**
  * @brief  This function is executed in case of error occurrence.
  * @retval None
  */
void Error_Handler(void)
{
  /* USER CODE BEGIN Error_Handler_Debug */
  /* User can add his own implementation to report the HAL error return state */
  __disable_irq();
  while (1)
  {
  }
  /* USER CODE END Error_Handler_Debug */
}
#ifdef USE_FULL_ASSERT
/**
  * @brief  Reports the name of the source file and the source line number
  *         where the assert_param error has occurred.
  * @param  file: pointer to the source file name
  * @param  line: assert_param error line source number
  * @retval None
  */
void assert_failed(uint8_t *file, uint32_t line)
{
  /* USER CODE BEGIN 6 */
  /* User can add his own implementation to report the file name and line number,
     ex: printf("Wrong parameters value: file %s on line %d\r\n", file, line) */
  /* USER CODE END 6 */
}
#endif /* USE_FULL_ASSERT */
