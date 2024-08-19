// xinma-cut-common.js
export function getMousePos(evt, canvas) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) * (canvas.width / rect.width),
        y: (evt.clientY - rect.top) * (canvas.height / rect.height)
    };
}

export function detectClickInsideRect(x, y, rects) {
    for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        if (
            x >= rect.startX &&
            x <= rect.startX + rect.width &&
            y >= rect.startY &&
            y <= rect.startY + rect.height
        ) {
            return i; // 返回点击的方框索引
        }
    }
    return null; // 如果没有点击任何方框，则返回 null
}

export function getCursorForCorner(cornerOrEdge) {
    const cursors = {
        tl: 'nw-resize', tr: 'ne-resize', bl: 'sw-resize', br: 'se-resize',
        top: 'n-resize', right: 'e-resize', bottom: 's-resize', left: 'w-resize',
    };
    return cursors[cornerOrEdge] || 'default';
}

export function showContextMenu(x, y, menuItems, callback) {
    // 清理可能已经存在的菜单
    clearContextMenu();
    // 获取滚动偏移量
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    x = x + scrollX;
    y = y + scrollY;
    console.log(x, y, document.body.clientWidth, document.body.clientHeight);
    if (y > document.body.clientHeight - 120) {
        y = document.body.clientHeight - 120;
    }
    // 创建菜单元素并设置位置
    const menu = document.createElement('ul');
    menu.id = 'context-menu'; // 给菜单添加一个id，方便查找和清理
    menu.className = 'context-menu'; // 添加样式类
    menu.style.position = 'absolute';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    // 添加菜单项
    menuItems.forEach(item => {
        const menuItem = document.createElement('li');
        menuItem.textContent = item.label;
        menuItem.id = item.id;
        menuItem.addEventListener('click', callback);
        menu.appendChild(menuItem);
    });

    document.body.appendChild(menu);

    // 监听一次点击事件，用于隐藏菜单
    window.addEventListener('click', () => {
        clearContextMenu();
    }, { once: true });
}

export function clearContextMenu() {
    // 查找并移除已有的菜单
    const existingMenu = document.getElementById('context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
}

// xinma-cut-common.js
export function detectMouseNearCorner(x, y, rects, resizeThreshold) {
    // ... (原 detectMouseNearCorner 函数的代码，使用参数 rects 和 resizeThreshold)
    for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        const corners = {
            tl: [rect.startX, rect.startY],
            tr: [rect.startX + rect.width, rect.startY],
            bl: [rect.startX, rect.startY + rect.height],
            br: [rect.startX + rect.width, rect.startY + rect.height],
        };

        // 检测角落
        for (const [corner, [cx, cy]] of Object.entries(corners)) {
            const dx = x - cx;
            const dy = y - cy;
            if (dx * dx + dy * dy < resizeThreshold * resizeThreshold) {
                return { rectIndex: i, corner };
            }
        }
        // 检测边缘
        if (x >= rect.startX + resizeThreshold && x <= rect.startX + rect.width - resizeThreshold) {
            if (Math.abs(y - rect.startY) < resizeThreshold) {
                return { rectIndex: i, edge: 'top' };
            }
            if (Math.abs(y - (rect.startY + rect.height)) < resizeThreshold) {
                return { rectIndex: i, edge: 'bottom' };
            }
        }
        if (y >= rect.startY + resizeThreshold && y <= rect.startY + rect.height - resizeThreshold) {
            if (Math.abs(x - rect.startX) < resizeThreshold) {
                return { rectIndex: i, edge: 'left' };
            }
            if (Math.abs(x - (rect.startX + rect.width)) < resizeThreshold) {
                return { rectIndex: i, edge: 'right' };
            }
        }
    }
    return null;
}

export function redrawCanvas(ctx, image, canvas, rects, hoverRectIndex) {
    // ... (原 redrawCanvas 函数的代码，使用参数 ctx, image, rects, hoverRectIndex)
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    rects.forEach((rect, index) => {
        // 绘制矩形边框
        ctx.beginPath();
        ctx.rect(rect.startX, rect.startY, rect.width, rect.height);
        ctx.strokeStyle = index === hoverRectIndex ? 'blue' : 'red';
        ctx.stroke();

        // 填充矩形背景
        ctx.fillStyle = rect.type == 0 ? 'rgba(0,0,0,.5)' : 'rgba(0,255,0,.5)';
        ctx.fillRect(rect.startX, rect.startY, rect.width, rect.height);

        // 动态计算字体大小
        const fontSize = Math.max(Math.min(rect.width, rect.height) / 4, 10); // 字体大小至少为 10px
        ctx.font = `${fontSize}px Arial`; // 动态设置字体大小

        // 计算矩形中心
        const centerX = rect.startX + rect.width / 2;
        const centerY = rect.startY + rect.height / 2;

        // 设置文本颜色为白色，以便与深色背景形成对比
        ctx.fillStyle = 'white'; // 文本颜色
        ctx.textAlign = 'center'; // 水平居中
        ctx.textBaseline = 'middle'; // 垂直居中

        // 为了确保文本可见，可以在文本下绘制一个轮廓或阴影
        ctx.lineWidth = 3; // 设置轮廓宽度
        ctx.strokeStyle = 'black'; // 轮廓颜色
        if (rect.type == 1) {
            ctx.strokeStyle = 'green'; // 轮廓颜色
            ctx.strokeText("质检码", centerX, centerY); // 绘制文本轮廓
            // 绘制文本
            ctx.fillText("质检码", centerX, centerY); // 绘制文本
        } else {
            ctx.strokeText(rect.id, centerX, centerY); // 绘制文本轮廓
            // 绘制文本
            ctx.fillText(rect.id, centerX, centerY); // 绘制文本
        }

    });
}

export function captureFeatureCode(pattern, rects, canvas, patternWidth, patternHeight) {
    console.log(pattern, patternWidth, patternHeight);
    // ... (原 captureFeatureCode 函数的代码，使用参数 pattern, rects, canvas, patternWidth, patternHeight)
    rects.forEach((rect) => {
        if (rect.type == 1) return;
        // 创建一个新的canvas元素来绘制截取的图像
        const captureCanvas = document.createElement('canvas');
        const captureCtx = captureCanvas.getContext('2d');

        // 根据选中的特征码方位来设置截取的位置和大小
        let sx, sy, sw, sh;
        switch (pattern) {
            case 'top':
                sx = rect.startX;
                sy = rect.startY - patternHeight - 2;
                sw = rect.width;
                sh = patternHeight;
                break;
            case 'bottom':
                sx = rect.startX;
                sy = rect.startY + rect.height + 2;
                sw = rect.width;
                sh = patternHeight;
                break;
            case 'left':
                sx = rect.startX - patternWidth - 2;
                sy = rect.startY;
                sw = patternWidth;
                sh = rect.height;
                break;
            case 'right':
                sx = rect.startX + rect.width + 2;
                sy = rect.startY;
                sw = patternWidth;
                sh = rect.height;
                break;
            case 'top_bottom':
                sx = rect.startX;
                sy = rect.startY - patternHeight;
                sw = rect.width;
                sh = rect.height + patternHeight * 2;
                break;
            case 'left_right':
                sx = rect.startX - patternWidth;
                sy = rect.startY;
                sw = rect.width + patternWidth * 2;
                sh = rect.height;
                break;
            case 'all':
                sx = rect.startX - patternWidth;
                sy = rect.startY - patternHeight;
                sw = rect.width + patternWidth * 2;
                sh = rect.height + patternHeight * 2;
                break;
            default:
                return; // 如果没有匹配的方位，不执行操作
        }
        if (sx < 0) {
            sw += sx; // 减去负的起始x坐标
            sx = 0;   // 将起始x坐标设置为0
        }
        if (sy < 0) {
            sh += sy; // 减去负的起始y坐标
            sy = 0;   // 将起始y坐标设置为0
        }
        // 如果截取的区域超过了canvas的宽度或高度，只截取未超过的区域
        if (sx + sw > canvas.width) {
            sw = canvas.width - sx; // 调整宽度
        }
        if (sy + sh > canvas.height) {
            sh = canvas.height - sy; // 调整高度
        }

        // 设置captureCanvas的大小和绘制截取的图像
        captureCanvas.width = sw;
        captureCanvas.height = sh;
        captureCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);

        // 如果需要，填充选中矩形区域为纯白色
        if (['top_bottom', 'left_right', 'all'].includes(pattern)) {
            // 计算相对于新画布的坐标
            const relativeX = rect.startX - sx;
            const relativeY = rect.startY - sy;

            // 使用相对坐标填充矩形
            captureCtx.fillStyle = '#FFFFFF';
            captureCtx.fillRect(relativeX - 2, relativeY - 2, rect.width + 4, rect.height + 4);
        }
        let tempImg = captureCtx.getImageData(0, 0, sw, sh);
        for (let i = 0; i < tempImg.height; i++) {
            for (let j = 0; j < tempImg.width; j++) {
                var x = (i * 4) * tempImg.width + (j * 4);
                var r = tempImg.data[x];
                var g = tempImg.data[x + 1];
                var b = tempImg.data[x + 2];
                tempImg.data[x] = tempImg.data[x + 1] = tempImg.data[x + 2] = (r + g + b) / 3;
            } 100
        }
        captureCtx.putImageData(tempImg, 0, 0, 0, 0, sw, sh);

        rect.capturedImage = captureCanvas.toDataURL("image/jpeg", 0.8);
    });
    console.log(rects);
}
