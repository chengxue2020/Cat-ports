<?php

//  /\_/\  
// | o o | 
//  > ^ < 


// 获取要爬取的网址
$url = $_GET['url'];

// 将中文域名转换为 Punycode 格式
$punycode_url = idn_to_ascii(parse_url($url, PHP_URL_HOST));
$encoded_url = str_replace(parse_url($url, PHP_URL_HOST), $punycode_url, $url);

// 自定义请求头
$options = array(
    'http' => array(
        'method' => 'GET',
        'header' => 'User-Agent: okhttp',
    ),
);

// 使用 stream_context_create() 方法创建上下文流
$context = stream_context_create($options);

// 使用 file_get_contents() 方法请求网页并获取内容
$response = file_get_contents($encoded_url, false, $context);

// 判断是否需要截取
if (strpos($response, '**') !== false) {
    $response = substr($response, strpos($response, '**') + 2);
}

// 判断是否需要解码
if (base64_decode($response, true)) {
    // 如果是 base64 编码，则解码后输出
    echo base64_decode($response);
} else {
    // 否则直接输出响应内容
    echo $response;
}

// 判断是否需要下载 jar 包
if (strpos($response, ';md5;') !== false) {
    // 截取 jar 包地址
    $jar_url = substr($response, strpos($response, 'spider":"') + 9);
    $jar_url = substr($jar_url, 0, strpos($jar_url, ';md5;'));

    // 设置文件名
    $filename = basename($jar_url);

    // 自定义请求头
    $options = array(
        'http' => array(
            'method' => 'GET',
            'header' => 'User-Agent: okhttp',
        ),
    );

    // 使用 stream_context_create() 方法创建上下文流
    $context = stream_context_create($options);

    // 使用 file_get_contents() 方法下载 jar 包
    $jar_content = file_get_contents($jar_url, false, $context);

    // 输出响应头，告诉浏览器要下载文件
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename=' . $filename);
    header('Content-Transfer-Encoding: binary');
    header('Content-Length: ' . strlen($jar_content));
    ob_clean();
    flush();
    echo $jar_content;
}
