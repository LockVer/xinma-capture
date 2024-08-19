import { getMousePos, detectClickInsideRect, getCursorForCorner, showContextMenu, clearContextMenu, detectMouseNearCorner, redrawCanvas, captureFeatureCode } from './xinma-cut-common';
export default {
    props: {
        pattern: {
            type: String,
            default: 'all',
        },
        patternWidth: {
            type: Number,
            default: 10,
        },
        patternHeight: {
            type: Number,
            default: 10,
        }
    },
    watch: {
        pattern() {
            this.captureFeatureCode()
        },
        patternWidth() {
            this.captureFeatureCode()
        },
        patternHeight() {
            this.captureFeatureCode()
        }
    },
    data() {
        return {
            image: null,
            ctx: null,
            rects: [],
            rectIndex: 0,
            isDrawing: false,
            isResizing: false,
            isDragging: false,
            selectedRectIndex: null,
            selectedCorner: null,
            selectedEdge: null,
            hoverRectIndex: null,
            hoverCorner: null,
            selectedRightClickIndex: null,
            dragOffsetX: 0,
            dragOffsetY: 0,
            startX: 0,
            startY: 0,
            resizeThreshold: 10,
            minRectSize: 10,
        };
    },
    methods: {
        initCanvas(img) {
            this.$refs.canvas.width = img.width;
            this.$refs.canvas.height = img.height;
            this.ctx = this.$refs.canvas.getContext('2d');
            this.image = img;
            this.ctx.drawImage(img, 0, 0);
        },
        getMousePos(evt) {
            return getMousePos(evt, this.$refs.canvas);
        },
        detectClickInsideRect(x, y) {
            return detectClickInsideRect(x, y, this.rects);
        },
        getCursorForCorner(cornerOrEdge) {
            return getCursorForCorner(cornerOrEdge);
        },
        showContextMenu(x, y) {
            const menuItems = [
                { id: "setQCCode", label: "设置为质检码" },
                { id: "copyRect", label: "复制" },
                { id: "deleteRect", label: "删除" }
            ];
            showContextMenu(x, y, menuItems, this.handleMenuClick);
        },
        clearContextMenu() {
            clearContextMenu();
        },
        detectMouseNearCorner(x, y) {
            return detectMouseNearCorner(x, y, this.rects, this.resizeThreshold);
        },
        redrawCanvas() {
            redrawCanvas(this.ctx, this.image, this.$refs.canvas, this.rects, this.hoverRectIndex);
        },
        captureFeatureCode() {
            captureFeatureCode(this.pattern, this.rects, this.$refs.canvas, this.patternWidth, this.patternHeight);
            this.$forceUpdate();
        },

        sortRects() {
            return this.rects.slice().sort((a, b) => {
                return a.startY - b.startY;
            }).map((rect) => rect.capturedImage);
        },
        handleMouseDown(event) {
            if (event.button !== 0) return;
            const mousePos = this.getMousePos(event);
            const offsetX = mousePos.x;
            const offsetY = mousePos.y;
            //const { offsetX, offsetY } = event;
            const cornerOrEdge = this.detectMouseNearCorner(offsetX, offsetY);
            const clickedRectIndex = this.detectClickInsideRect(offsetX, offsetY);

            if (cornerOrEdge && cornerOrEdge.corner) {
                this.isResizing = true;
                this.selectedRectIndex = cornerOrEdge.rectIndex;
                this.selectedCorner = cornerOrEdge.corner;
            }
            else if (cornerOrEdge && cornerOrEdge.edge) {
                this.isResizing = true;
                this.selectedRectIndex = cornerOrEdge.rectIndex;
                this.selectedEdge = cornerOrEdge.edge;
            }
            else if (clickedRectIndex !== null) {
                this.isDragging = true;
                this.selectedRectIndex = clickedRectIndex;
                const rect = this.rects[clickedRectIndex];
                this.dragOffsetX = offsetX - rect.startX;
                this.dragOffsetY = offsetY - rect.startY;
                this.$refs.canvas.style.cursor = 'move';
            } else {
                this.rectIndex++
                this.rects.push({
                    startX: offsetX,
                    startY: offsetY,
                    width: 0,
                    height: 0,
                    id: this.rectIndex,
                    type: 0
                });
                this.selectedRectIndex = this.rects.length - 1;
                this.isDrawing = true;
            }
            this.startX = offsetX;
            this.startY = offsetY;
            window.addEventListener('mouseup', this.handleMouseUp);
        },
        handleMouseMove(event) {
            //const { offsetX, offsetY } = event;
            const mousePos = this.getMousePos(event);
            const offsetX = mousePos.x;
            const offsetY = mousePos.y;
            if (this.isDrawing) {
                this.updateRectSize(offsetX, offsetY);
            } else if (this.isResizing) {
                this.resizeRect(offsetX, offsetY);
            } else if (this.isDragging) {
                this.dragRect(offsetX, offsetY);
            } else {
                const hoverState = this.detectMouseNearCorner(offsetX, offsetY);
                if (hoverState) {
                    this.hoverRectIndex = hoverState.rectIndex;
                    this.hoverCorner = hoverState.corner;
                    this.$refs.canvas.style.cursor = this.getCursorForCorner(hoverState.corner || hoverState.edge);
                } else {
                    this.hoverRectIndex = null;
                    this.hoverCorner = null;
                    this.$refs.canvas.style.cursor = 'default';
                }
            }

            this.redrawCanvas();
        },
        handleMouseUp() {
            if (this.isDrawing) {
                const rect = this.rects[this.selectedRectIndex];
                if (Math.abs(rect.width) >= this.minRectSize && Math.abs(rect.height) >= this.minRectSize) {
                    // 如果矩形大小合适，截取特征码图像
                    console.log(this.selectedRectIndex)
                    this.captureFeatureCode();
                } else {
                    // 如果矩形太小，就移除它
                    this.rects.splice(this.selectedRectIndex, 1);
                }
            }
            if (this.isDragging) {
                this.$refs.canvas.style.cursor = 'default';
            }

            console.log(this.selectedRectIndex)
            if (this.selectedRectIndex !== null) {
                this.captureFeatureCode();
            }
            this.isDrawing = false;
            this.isResizing = false;
            this.isDragging = false;
            this.selectedRectIndex = null;
            this.selectedCorner = null;
            this.redrawCanvas(); // 重新绘制画布以反映任何变化
            // 从 window 对象移除事件监听器
            window.removeEventListener('mouseup', this.handleMouseUp);
        },
        handleMouseLeave() {
            // 如果用户正在绘制、拖拽或调整大小，结束这个过程
            if (this.isDrawing || this.isDragging || this.isResizing) {
                this.handleMouseUp();
            }
        },
        handleRightClick(event) {
            event.preventDefault(); // 防止默认的右键菜单显示
            const mousePos = this.getMousePos(event);
            const offsetX = mousePos.x;
            const offsetY = mousePos.y;
            // 获取鼠标位置相对于canvas的位置
            //const { offsetX, offsetY } = event;

            // 检测鼠标点击的位置是否在某个方框内
            const clickedRectIndex = this.detectClickInsideRect(offsetX, offsetY);
            console.log(clickedRectIndex)
            // 如果在方框内，则显示菜单
            if (clickedRectIndex !== null) {
                this.selectedRightClickIndex = clickedRectIndex; // 更新选中的矩形索引
                this.showContextMenu(event.clientX, event.clientY);
            }
            // 如果不在方框内，则不做任何事情
        },
        dragRect(currentX, currentY) {
            const rect = this.rects[this.selectedRectIndex];
            const newX = currentX - this.dragOffsetX;
            const newY = currentY - this.dragOffsetY;

            // 限制方框不超出左边界
            rect.startX = Math.max(0, newX);
            // 限制方框不超出上边界
            rect.startY = Math.max(0, newY);
            // 限制方框不超出右边界
            rect.startX = Math.min(rect.startX, this.$refs.canvas.width - rect.width);
            // 限制方框不超出下边界
            rect.startY = Math.min(rect.startY, this.$refs.canvas.height - rect.height);
        },
        updateRectSize(currentX, currentY) {
            const rect = this.rects[this.selectedRectIndex];
            rect.width = currentX - rect.startX;
            rect.height = currentY - rect.startY;
        },
        resizeRect(currentX, currentY) {
            const rect = this.rects[this.selectedRectIndex];
            //const { corner } = this.selectedCorner; // 注意这里我们使用 this.selectedCorner

            if (this.selectedCorner) {
                console.log(this.selectedCorner)
                // ...处理角落调整大小的现有逻辑
                switch (this.selectedCorner) {
                    case 'tl': // top-left
                        rect.width += rect.startX - currentX;
                        rect.height += rect.startY - currentY;
                        rect.startX = currentX;
                        rect.startY = currentY;
                        break;
                    case 'tr': // top-right
                        rect.width = currentX - rect.startX;
                        rect.height += rect.startY - currentY;
                        rect.startY = currentY;
                        break;
                    case 'bl': // bottom-left
                        rect.width += rect.startX - currentX;
                        rect.height = currentY - rect.startY;
                        rect.startX = currentX;
                        break;
                    case 'br': // bottom-right
                        rect.width = currentX - rect.startX;
                        rect.height = currentY - rect.startY;
                        break;
                }
                if (rect.width < 0) {
                    rect.width = -rect.width;
                    this.selectedCorner = this.selectedCorner.replace('l', 'r');
                }
                if (rect.height < 0) {
                    rect.height = -rect.height;
                    this.selectedCorner = this.selectedCorner.replace('t', 'b');
                }
            }
            //const { edge } = this.selectedEdge; // 假设我们有一个变量 this.selectedEdge
            if (this.selectedEdge) {
                //const { startX, startY, width, height } = rect;
                const deltaX = currentX - this.startX;
                const deltaY = currentY - this.startY;

                switch (this.selectedEdge) {
                    case 'top':
                        rect.startY += deltaY;
                        rect.height -= deltaY;
                        break;
                    case 'right':
                        rect.width += deltaX;
                        break;
                    case 'bottom':
                        rect.height += deltaY;
                        break;
                    case 'left':
                        rect.startX += deltaX;
                        rect.width -= deltaX;
                        break;
                }

                // Ensure the rectangle size does not become negative
                if (rect.width < 0) {
                    rect.width = -rect.width;
                    rect.startX -= rect.width;
                    this.selectedEdge = 'right';
                }
                if (rect.height < 0) {
                    rect.height = -rect.height;
                    rect.startY -= rect.height;
                    this.selectedEdge = 'bottom';
                }

                // Ensure the rectangle does not go outside the image boundaries
                rect.startX = Math.max(0, Math.min(rect.startX, this.$refs.canvas.width - rect.width));
                rect.startY = Math.max(0, Math.min(rect.startY, this.$refs.canvas.height - rect.height));
                rect.width = Math.min(rect.width, this.$refs.canvas.width - rect.startX);
                rect.height = Math.min(rect.height, this.$refs.canvas.height - rect.startY);

                // Update the starting point for the next move
                this.startX = currentX;
                this.startY = currentY;
            }

        },
        updateHoverState(offsetX, offsetY) {
            const corner = this.detectMouseNearCorner(offsetX, offsetY);
            if (corner) {
                this.hoverRectIndex = corner.rectIndex;
                this.hoverCorner = corner.corner;
                this.$refs.canvas.style.cursor = this.getCursorForCorner(corner.corner);
            } else {
                this.hoverRectIndex = null;
                this.hoverCorner = null;
                this.$refs.canvas.style.cursor = 'default';
            }
        },
        handleMenuClick(event) {
            console.log(event.target.id)
            switch (event.target.id) {
                case "copyRect":
                    console.log("复制")
                    if (this.selectedRightClickIndex !== null) {
                        const rect = this.rects[this.selectedRightClickIndex];
                        this.rectIndex++;
                        this.rects.unshift({
                            startX: rect.startX,
                            startY: rect.startY,
                            width: rect.width,
                            height: rect.height,
                            id: this.rectIndex,
                            type: 0
                        });
                        this.selectedRectIndex = 0; // 选中新复制的矩形
                        this.captureFeatureCode();
                        console.log(this.rects)
                    }
                    break;
                case "deleteRect":
                    if (this.selectedRightClickIndex !== null) {
                        this.rects.splice(this.selectedRightClickIndex, 1); // 删除选中的矩形
                    }
                    break;
                case "setQCCode":
                    if (this.selectedRightClickIndex !== null) {
                        this.rects.forEach((rect) => {
                            rect.type = 0;
                        })
                        this.rects[this.selectedRightClickIndex].type = 1;
                    }
                    break;
            }
            this.selectedRightClickIndex = null; // 重置选中的矩形索引
            this.redrawCanvas(); // 重绘画布
        },
        getRects() {
            return this.rects.map((rect) => ({
                startX: Math.max(0, rect.startX),
                startY: Math.max(0, rect.startY),
                width: rect.width,
                height: rect.height,
                type: rect.type,
                id: rect.id
            }))
        },
        setRects(rects) {
            this.rects = rects;
            this.redrawCanvas();
        }
    }
}