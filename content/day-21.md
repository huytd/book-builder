---
title: Test code is like a box of chocolates
author: Tuna
date: 2023-12-21
topic: Testing, Engineering
---

Thử tưởng tượng có một nhà toán học đang muốn viết một đoạn code đơn giản để kiểm nghiệm Collatz conjecture. Collatz conjecture được mô tả như sau:
> Bắt đầu với bất kì số nguyên dương nào. Nếu số đó là lẻ, nhân 3 cộng 1, nếu số đó là chẵn, chia cho 2. Tiếp tục áp dụng quy luật trên cho kết quả tìm được.
> Một chuỗi được tạo bởi quy luật trên cuối cùng sẽ quay về 1.

 Đây là đoạn code tính toán
```kotlin
 fun calculate(n: Int): Int {
	 if (n % 2 == 0) {
		return n / 2
	 } else {
		return n * 3 + 1
	 }
 }
```

và đoạn test code cho hàm trên
```kotlin
@Test
fun testCalculate() {
    val numbers = listOf(1,2,3,4,5, 500, 5001,1000,1001)

    for (num in numbers) {
        if (num % 2 == 0) {
            assertEquals(num / 2, calculate(num))
        } else {
            assertEquals(num * 3 + 1, calculate(num))
        }
    }
}
```

Theo bạn thì có vấn đề gì với đoạn test code không?

## Hãy làm cho quá trình xác nhận trở nên rõ ràng nhất có thể

Thường thì test code không được viết để đọc, mà là để bị làm cho sai (Test failed). Cơ hội để test code được xem lại chỉ xảy ra khi kiểm thử bị hỏng, và điều này có thể xảy ra vài năm sau khi chúng ta đã quên hết về ngữ cảnh xung quanh đoạn test code.

Hãy thử refactor đoạn test code!

### Tách kiểm tra số chẵn và số lẽ
Thay vì sử dụng cấu trúc if-else để áp dụng việc xác minh tương ứng cho mỗi trường của số chẵn và số lẽ, chúng ta nên chia tập hợp đầu vào thành hai tập nhỏ hơn, một cho nhánh if và một cho nhánh else. Bằng cách làm đó, chúng ta không cần sử dụng if-else.

```kotlin
@Test
fun testCalculateWithOddNumbers() {
    val oddNumbers = [1, 3, 5, 5001, 1001]
    for (num in oddNumbers) {
        assertEquals(num * 3 + 1, calculate(num))
    }
}

@Test
fun testCalculateWithEvenNumbers() {
    val evenNumbers = [2, 4, 500, 1000]
    for (num in evenNumbers) {
        assertEquals(num / 2, calculate(num))
    }
}
```

### Loại bỏ `for`
Vì tập hợp đầu vào đã được xác định và trong hầu hết các trường hợp, chúng ta không sử dụng số ngẫu nhiên, nên không cần sử dụng vòng lặp để đi qua các trường hợp; thay vào đó, chúng ta có thể sao chép mã cho mỗi trường hợp kiểm thử. Nói cách khác, nguyên tắc DRY (Don't Repeat Yourself) không cần thiết trong test code.

Việc sử dụng một vòng lặp khi xác nhận các giá trị cũng làm cho việc nhận biết trường hợp nào là sai trở nên khó khăn (ví dụ trong Java hoặc Kotlin, assert exception không thể chỉ rõ là lỗi nằm ở test case nào).
```
fun testCalculateWithOddNumbers() {
    assertEquals(1 * 3 + 1, calculate(1))
    assertEquals(3 * 3 + 1, calculate(3))
    assertEquals(5 * 3 + 1, calculate(5))
    assertEquals(5001 * 3 + 1, calculate(5001))
    assertEquals(1001 * 3 + 1, calculate(1001))
}

fun testCalculateWithEvenNumbers() {
    assertEquals(2 / 2, calculate(2))
    assertEquals(4 / 2, calculate(4))
    assertEquals(500 / 2, calculate(500))
    assertEquals(1000 / 2, calculate(1000))
}
```
Lưu ý rằng phương pháp này được khuyến khích khi chúng ta thực hiện việc xác minh (assertion), không phải khi chạy test như t.Run() trong Golang, vì chúng ta có thể dễ dàng truy vết trở lại trường hợp kiểm thử cụ thể đã thất bại.

### Sử dụng giá trị tuyệt đối nếu có thể

Tham chiếu đến giá trị tuyệt đối hoặc giá trị cuối cùng của phép tính giúp chúng ta nhảy đến trường hợp kiểm thử bị lỗi và nhanh chóng hiểu được vấn đề thông qua thông báo lỗi.

Có hai cách chúng ta có thể áp dụng điều này vào ví dụ của chúng ta:

**Option 1**
```kotlin
fun testCalculateWithOddNumbers() {
    assertEquals(4, calculate(1)) // 1 * 3 + 1
    assertEquals(10, calculate(3)) // 3 * 3 + 1
    assertEquals(16, calculate(5)) // 5 * 3 + 1
    assertEquals(15004, calculate(5001)) // 5001 * 3 + 1
    assertEquals(3004, calculate(1001)) // 1001 * 3 + 1
}
```

**Option 2**
```kotlin
fun testCalculateWithOddNumbers() {
    assertEquals(1 * 3 + 1, calculate(1)) // 4
    assertEquals(3 * 3 + 1, calculate(3)) // 10
    assertEquals(5 * 3 + 1, calculate(5)) // 16
    assertEquals(5001 * 3 + 1, calculate(5001)) // 15004
    assertEquals(1001 * 3 + 1, calculate(1001)) // 3004
}
```

> Test code is like a box of chocolates, you never know what you're going to get (until it’s broken) - mimicking “Life is like a box of chocolates - Forrest Gump”