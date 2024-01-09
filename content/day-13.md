---
title: Extend the ADB to Make App Debugging Easier
author: Tuna
date: 2023-12-13
topic: Mobile, Android, Engineering, Debugging
---

Khi phát triển một app Android, mặc dù chúng ta có thể backup lại test data cho các mục đích sử dụng khác nhau (xem bài viết [AoS day 6](https://github.com/webuild-community/advent-of-sharing/blob/main/2023/day-06.md)), nhu cầu cần phải có một debug menu phải mock data, thay đổi các config, hoặc kiểm tra trạng thái hiện tại của dữ liệu, v.v... luôn luôn hiện hữu.

Android có sẵn các library như Facebook's Flipper, Hyperion, v.v. hoặc một số team có thể tự develop debug menu (ví dụ LINE).
Khi app còn đơn giản, số lượng items trên menu ít, việc quản lí, bảo trì, hướng dẫn sử dụng các chức năng của debug menu khá dễ dàng. Tuy nhiên, theo sự phát triển của app, càng nhiều feature mới sẽ càng cần có nhiều menu và item. Càng ngày, việc sử dụng debug menu càng khó khăn và mất thời gian, không chỉ cho dev mà còn cho cả team QA. Sẽ không ít lần bạn sẽ nhìn thấy một hướng dẫn để mock config hoặc thực hiện 1 debug action như thế này:
```
Debug Menu > Service configuration > Content recommendations > Enable > true

Debug Menu > Service configuration > Content recommendations > Enable > false
```

2 thao tác `enable` `disable`  tính năng Content recommendations này tưởng chừng đơn giản, nhưng nếu đặt trong một danh sách dài 100 items cùng màu, cùng kiểu chữ, điều đó sẽ là ác mộng với bất kì ai, đặc biệt là QA, khi phải thực hiện đi thực hiện lại thao tác này trên nhiều lần (xem ví dụ Android Developer menu.)

<img src=https://miro.medium.com/v2/resize:fit:1400/format:webp/1*qgJhyM-5_9fbLIK5EEl0Hw.gif width=250 />


Chúng ta có thể cải thiện bằng việc thêm chức năng search tương tự với Android's Settings. Tuy nhiên, việc quản lí vào bảo trì cũng như luôn luôn đảm bảo việc thêm item mới aligned với searchable không phải bao giờ cũng dễ dàng, nhất là khi đây chỉ là một tính năng phụ trợ, developer thường không muốn dành quá nhiều thời gian để hỗ trợ cho nó trong khi vẫn còn nhiều deadline dí sát đ:'t.

Rồi, nói nhiều như vậy thì cuối cùng giải pháp là gì?
Câu trả lời vẫn là `adb` (Android Debug Bridge).

ADB là một công cụ mạnh mẽ để tương tác với Android device, tuy nhiên, rất tiếc là tập lệnh để tương tác với app lại khá hạn chế ([link](https://developer.android.com/tools/adb#issuingcommands)). Rất may, adb có một vài lệnh chúng ta có thể dùng được
```
adb shell dumpsys
adb shell am broadcast -p 
```

**`adb shell dumpsys`**
Lệnh thứ nhất trigger service dump, khi gọi lệnh này tới một service của 1 app, hàm `dump` của service đó sẽ được thực thi. 
```kotlin
override fun dump(
    fd: FileDescriptor?, 
    writer: PrintWriter?, 
    args: Array<out String>?
)
```
Ưu điểm của việc dùng service dump là chúng ta có thể nhận lại output một cách dễ dàng thông qua `writer` và `args` khá giống với structure của một lệnh khi dùng command line. Nhược điểm là app phải chạy thì lệnh mới có thể thực thi được.

**`adb shell am broadcast`**

Lệnh thứ 2 dùng để trigger [broadcast receiver](https://developer.android.com/guide/components/broadcasts) . 

```kotlin
override fun onReceive(context: Context, intent: Intent) {
    val command = intent.getStringExtra("cmd") ?: return
    // snippet
}
```
Với broadcast thì lệnh có thể được thực thi kể cả lúc app đang không được chạy. Mặc dù không có `args` như Service dump, chúng ta vẫn có thể đọc input từ `intent`. Thậm chí chúng ta còn có thể đọc trực tiếp primitive type mà không phải convert từ string như với `args` của service dump. Mình sẽ nói thêm ở phần sau.
Một nhược điểm của việc dùng broadcast là không thể đọc được output trực tiếp từ output như với service dump. Một phương pháp để hiển thị output từ cho command line là filter từ logcat.

**Deeplink**
Ngoài 2 lệnh trên, còn một cách nữa nên được để ý đến là sử dụng deeplink. Như đã đề cập ở trên, một trong những user thường xuyên của Debug menu chính là QA. QA member có thể không dùng được console để viết lệnh như ở trên. Cung cấp một công cụ đơn giản hơn gần như là một MUST requirement.
Ưu điểm lớn thứ 2 của deeplink là shareable action. Chúng ta có thể dễ dàng share debug action cho người khác để có thể tái tạo lại debug configuration mà không phải hướng dẫn các step như với debug menu.

Với deeplink, chúng ta sẽ parse URI như thông thường để lấy ra được arguments. Deeplink cũng có cùng một nhược điểm với broadcast là không thể trả về output cho command line.

Một nhược điểm nữa của Deeplink là việc gom nhiều actions vào 1 hit không đơn giản như với các tương tác dùng adb. Với command line, chúng ta có thể gom nhiều lệnh bằng `;` hoặc vào 1 file script. Như vậy, với deeplink, chúng ta cần cung cấp công cụ để gom nhiều action vào 1 URI duy nhất. Mình sẽ nói thêm ở phần sau.

Ngoài 3 phương pháp trên, chúng ta vẫn còn một vài phương pháp khác để tương tác với app. Đoạn này nhường cho bạn nào tò mò có thể tìm hiểu thêm.

**Kiến trúc**
Xem thêm ở thread 

**Kiến trúc**
Sau khi đã có các công cụ để tương tác với app không qua UI của debug menu, tiếp theo, chúng ta cần có kiến trúc để có thể thêm các command một cách dễ dàng cũng như hỗ trợ tối đa các loại input và output.
```
       ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                                 
       │Service dump │   │  Broadcast  │   │  Deeplink   │                                 
       └──────┬──────┘   └──────┬──────┘   └──────┬──────┘                                 
              │                 │                 │                                        
       ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐                                 
       │   Adapter   │   │   Adapter   │   │   Adapter   │ Parse input to arguments        
       └──────┬──────┘   └──────┬──────┘   └──────┬──────┘ Provides suitable printer       
              └───────────┐     │     ┌───────────┘                                        
                          │     │     │                                                    
                      ┏━━━▼━━━━━▼━━━━━▼━━━┓                                                
                      ┃  Command Handler  ┃                                                
                      ┗━━━━━━━━━■━━━━━━━━━┛                                                
┌────────────────┐              │                                                          
│ ArgumentParser │              │  ┌────────────────────┐                                  
└────────────────┘              ├──▶1st level command #1│                                  
┌────────────────┐              │  └──□─────────────────┘                                  
│    Printer     │              │     │                                                    
└────────────────┘              │     │ ┌────────────────────┐                             
┌────────────────┐              │     └─▶2nd level command   │                             
│Deeplink factory│              │       └──□─────────────────┘                             
└────────────────┘              │          │                                               
                                │          │ ┌────────────────────┐                        
                                │          └─▶i-th level command  │                        
                                │            └────────────────────┘                        
                                │  ┌────────────────────┐                                  
                                └──▶1st level command #2│                                  
                                   └──□─────────────────┘                                  
                                      │                                                    
                                      │ ┌────────────────────┐                             
                                      └─▶2nd level command   │                             
                                        └──□─────────────────┘                             
                                           │                                               
                                           │ ┌────────────────────┐                        
                                           └─▶i-th level command  │                        
                                             └────────────────────┘                        
```

Các thành phần chính
- Adapter sẽ là nơi convert input (`args` của service dump, intent của broadcast, param của deeplink, etc.) thành một dạng mà ArgumentParser có thể hiểu được. Đây cũng là nơi mà output channel được wrap lại trong một Printer interface.
	- Để đơn giản cho việc xử lí, mình gợi ý nên dùng 1 param dạng string duy nhất cho broadcast cũng như deeplink, từ string đó sẽ được split ra để đưa về format của `args`. Bằng cách này, chúng ta không cần phải quan tâm tới kiểu hay name của 1 param.
	- Adapter cũng là nơi phân tách composite command thành nhiều ArgumentParser. 
	- Với deeplink, mình gợi ý nên dùng `~` để làm flag tách giữa các argument của 1 command vì nó trông khá giống kí tự space ` ` và không bị ảnh hưởng bởi URL encoding
	- Với composite command, mình gợi ý nên dùng `~~` làm flag để tách các command với nhau.
- ArgumentParser đơn giản là nơi để đọc các param theo index hay theo key. Một API cần có nữa của ArgumentParser là tạo ra sub argument parser cho các level sau của command.
- Printer có 2 loại chính, 1 là in thẳng ra console thông qua `writer` của service dump, loại thứ 2 là in ra logcat.
- CommandController sẽ tổng hợp và chạy tuần tự các command từ argument.
- CommandHandler sẽ là nơi thực thi command hoặc delegate việc thực thi tới level thấp hơn. 
	- Với 1 command hỗ trợ nhiều level, các level trên sẽ khá tương tự với CommandController.
	- Mình gợi ý nên tách command thành nhiều level như cách của Docker để dễ quản lí cũng như gõ lệnh.
	- Mỗi command cũng chỉ nên thực hiện 1 hành động duy nhất bởi vì chúng ta có thể gom nhiều hành động vào 1 lần trigger thông qua composite command
- DeeplinkFactory là một utility để in ra shareable command.

Tạm thời dừng ở đây vì viết nữa thì dài quá mà mình chưa chuẩn bị kịp sample code.