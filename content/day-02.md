---
title: You can’t simply send a UDP packet in web browser
topic: Front End, Networking
author: giongto35
---

Thường trong khi đi học về network, chúng ta thường gặp câu hỏi là: trong các trường hợp mình đòi hỏi độ trễ thấp và không quan tâm packet sẽ bị rơi rớt giữa chừng, như video stream hoặc multiplayer game, thì network protocol nào nên sử dụng? Câu trả lời ai cũng có trong đầu là sử dụng UDP.

Tuy nhiên, một điều đáng ngạc nhiên (ít nhất đối với mình) là không có cách thuận tiện nào để gửi một gói tin UDP trên WebBrowser. WebSocket chỉ hỗ trợ giao thức TCP.

Bài viết sẽ trả lời tại sao và chúng ta làm thế nào để sử dụng UDP network protocol trên Browser.

&nbsp;

## UDP vs TCP.

UDP và TCP là khái niệm cơ bản và ai cũng đã từng đọc qua nên mình chỉ nhắc lại nhanh chóng.

UDP (Unreliable Data Protocol):

-   UDP là connectionless, nghĩa là mình không tạo connection mà gửi packet đi luôn. UDP không cần các cơ chế như Handshake, Flow Control...

TCP (Transmission Control Protocol):

-   TCP đảm bảo data được gửi đi theo đúng thứ tự và reliable. TCP có các cơ chế như three-way handshake, flow control, connection termination để gửi packet một cách secure và duy trì smooth connection.
-   Head-of-line blocking. Đây là vấn đề lớn nhất của TCP. Nếu một gói tin bị thất lạc, các gói tin tiếp theo sẽ đợi cho đến khi gói tin bị mất được gửi đi, ảnh hưởng đến throughput và latency.

## Nền tảng của web browser được xây dựng trên HTTP

HTTP/HTTPS là protocol chủ yếu để thực hiện request và response giữa browser và server. HTTP và HTTPS thường sử dụng port 80 và port 443. Vì là nền tảng mặc định, các ports này thường được Firewall cho phép outbound traffic.

## WebSocket được xây dựng trên HTTP/TCP.

WebSocket thường được dùng để tạo connection 2 chiều giữa client và server với low latency. WebSocket connection được tạo ra bằng bắt đầu bằng HTTP handshake và sau đó được upgrade lên Websocket protocol, tạo ra một full-duplex connection. Bằng cách dựa trên HTTP và các port mặc định của HTTP, WebSocket không yêu cầu mở thêm port cho connection và dễ dàng chấp thuận bởi Firewall. Tuy nhiên, cũng vì dựa trên HTTP, ta cũng phải sử dụng TCP cho Websocket.

## Vì sao UDP không được hỗ trợ sẵn trong các trình duyệt?

UDP là connectionless và thiếu một số tính năng security có sẵn trong HTTPS (TLS). Vì không có connection nên packet nào nhìn cũng như nhau và 3rd party có thể chen vào giữa gửi packet, tạo ra rủi ro “Man In The Middle Attack”. Không có SSL nghĩa là gói tin không được mã hóa. Gói tin có thể bị giả danh hay sửa đổi trong quá trình gửi. UDP cũng không có flow control và congestion control như TCP. Điều này nghĩa là chúng ta không thể kiểm soát được lưu lượng UDP và dễ dẫn đến rủi ro DDoS từ trình duyệt web. Vì vậy, muốn sử dụng UDP trên WebBrowser, chúng ta cần thêm các layer phía trên hỗ trợ gửi UDP một cách an toàn.

## Ân nhân WebRTC

WebRTC là một all-in-one protocol tổng hợp các protocol cho tầng transport, network, Video, NAT traverse, và hỗ trợ gửi UDP packet với mục đích then chốt để đạt được real-time p2p communication. Đầu tiên, nó được phát triển để cho ứng dụng Video Call nhưng sau đó hỗ trợ thêm Datagram cho phép gửi đi reliable hoặc unreliable packet.

Cách tiếp cận này cho phép WebRTC có thể gửi và nhận, stream video với độ trễ cực thấp. Khác với các giao thức dựa trên HTTP trên các port 80 và 443, WebRTC cho phép thiết lập peer-to-peer connection giữa bất kỳ thiết bị nào. Thông thường, các kết nối inbound và outbound cần được firewall, router thông qua, và khi di chuyển giữa các hop trong network, địa chỉ ip cũng thay đổi. WebRTC đạt được quyền năng thông qua một cơ chế rất phức tạp gọi là ICE để thực hiện NAT Traverse (vượt tường lửa). Cơ chế này giúp thiết bị tìm public ip và public address mà giữa 2 thiết bị có thể lập connection được. Nói về cơ chế này sẽ còn rất nhiều nhưng ngoài nội dung của bài viết.

![](img/webrtc.png)

Sau khi connection được thiết lập giữa 2 device, WebRTC sẽ cho phép bạn stream media hay gửi UDP datagram thông qua connection này. WebRTC sử dụng DTLS (Datagram TLS) nên UDP datagram dựa trên WebRTC cũng được đảm bảo security.

## Nhưng rồi WebRTC trở nên quá phức tạp cho mô hình client-server.

WebRTC rất ràng buộc về các protocol được phép sử dụng. SCTP, DTLS, RTP, SRTP, ICE và Video Codec (VP8, H264, OPUS). Mỗi cái term này lại là một vùng trời kiến thức đòi hỏi người sử dụng nắm bắt. Vì WebRTC, được thiết kế ban đầu cho Video Call và giao tiếp peer-to-peer, các tính năng liên quan đến NAT Traversal không cần thiết trong mô hình client-server. Về phía server, mình có toàn quyền quyết định network và port setting, không cần WebRTC làm hộ. Khởi tạo connection cũng là một chiều outbound từ client đến server chứ không phải là 2 chiều.

Ngoài ra, bạn cũng không có nhiều khả năng thay đổi cách bạn muốn gửi packet nếu muốn sửa congestion/flow control. WebRTC là một cái blackbox mà nếu nó work thì work và không work thì bạn cũng không biết cách nào khác để làm nó tốt hơn.

WebRTC hiện tại vẫn là cách phổ biến nhất để gửi UDP trong client-server architecture cho các ứng dụng yêu cầu độ trễ thấp như Video Stream, Cloud Gaming, Online Game; dù cho WebRTC hoàn toàn bắt đầu từ một nhu cầu khác. Yêu cầu gửi UDP packet tưởng chừng nghe cơ bản và nền tảng này đang lại trở thành một trở ngại lớn khi phát triển các sản phẩm đòi hỏi low latency ngày nay.

## Vậy tương lai của UDP là?

Có một số tiến triển đáng kể để việc sử dụng UDP trên WebBrowser ngày càng khả thi hơn. Chúng ta sẽ dành dịp khác để nói tiếp về nó.

-   WebTransport: Hỗ trợ HTTP/3, giúp có thể thiết lập reliable hoặc unreliable transport. (https://developer.mozilla.org/en-US/docs/Web/API/WebTransport)
-   WHIP/WHEP: WebRTC dựa trên HTTP. (https://www.ietf.org/archive/id/draft-ietf-wish-whip-01.html)

## Tham khảo thêm

-   Agar.IO creator phàn nàn về WebSocket không có UDP và WebRTC quá phức tạp. (https://news.ycombinator.com/item?id=13264952)
