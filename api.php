<?php
// ================================================
//  DD HOT DOGS — API Backend
//  Archivo: api.php
//  Ubicación: C:/xampp/htdocs/ddhotdogs/api.php
// ================================================

// Permitir peticiones desde el navegador (CORS)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

// Responder a peticiones de verificación del navegador
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ── Conexión a la base de datos ──────────────────
$host   = "localhost";
$usuario = "root";       // usuario de XAMPP por defecto
$password = "";           // contraseña de XAMPP por defecto (vacía)
$base_datos = "ddhotdogs";

$conn = new mysqli($host, $usuario, $password, $base_datos);
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "No se pudo conectar a la base de datos: " . $conn->connect_error]);
    exit();
}

// ── Leer datos de la petición ────────────────────
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

// ── Enrutador de acciones ────────────────────────
switch ($action) {

    // ════════════════════════════════════════════
    //  MENÚ
    // ════════════════════════════════════════════

    case 'get_menu':
        $r = $conn->query("SELECT * FROM menu ORDER BY category, name");
        echo json_encode($r->fetch_all(MYSQLI_ASSOC));
        break;

    case 'add_menu':
        $stmt = $conn->prepare("INSERT INTO menu (id, name, price, category, icon) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("ssdss", $body['id'], $body['name'], $body['price'], $body['cat'], $body['icon']);
        $ok = $stmt->execute();
        echo json_encode(["ok" => $ok]);
        break;

    case 'update_menu_price':
        $stmt = $conn->prepare("UPDATE menu SET price = ? WHERE id = ?");
        $stmt->bind_param("ds", $body['price'], $body['id']);
        $ok = $stmt->execute();
        echo json_encode(["ok" => $ok]);
        break;

    case 'delete_menu':
        $id = $conn->real_escape_string($_GET['id']);
        $ok = $conn->query("DELETE FROM menu WHERE id = '$id'");
        echo json_encode(["ok" => $ok]);
        break;

    // ════════════════════════════════════════════
    //  VENTAS
    // ════════════════════════════════════════════

    case 'get_sales':
        $date  = isset($_GET['date']) ? $conn->real_escape_string($_GET['date']) : '';
        $where = $date ? "WHERE s.sale_date = '$date'" : "";

        $sales = $conn->query(
            "SELECT * FROM sales $where ORDER BY created_at DESC LIMIT 200"
        )->fetch_all(MYSQLI_ASSOC);

        // Adjuntar productos a cada venta
        foreach ($sales as &$sale) {
            $sid = $conn->real_escape_string($sale['id']);
            $sale['items'] = $conn->query(
                "SELECT * FROM sale_items WHERE sale_id = '$sid'"
            )->fetch_all(MYSQLI_ASSOC);
        }

        echo json_encode($sales);
        break;

    case 'add_sale':
        $conn->begin_transaction();
        try {
            // Guardar la venta
            $stmt = $conn->prepare(
                "INSERT INTO sales (id, sale_date, sale_time, total) VALUES (?, ?, ?, ?)"
            );
            $stmt->bind_param("sssd", $body['id'], $body['date'], $body['time'], $body['total']);
            $stmt->execute();

            // Guardar cada producto de la venta
            foreach ($body['items'] as $item) {
                $stmt2 = $conn->prepare(
                    "INSERT INTO sale_items (sale_id, product_name, product_icon, price, qty) VALUES (?, ?, ?, ?, ?)"
                );
                $stmt2->bind_param("sssdi", $body['id'], $item['name'], $item['icon'], $item['price'], $item['qty']);
                $stmt2->execute();
            }

            $conn->commit();
            echo json_encode(["ok" => true]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    // ════════════════════════════════════════════
    //  INVENTARIO
    // ════════════════════════════════════════════

    case 'get_inventory':
        $r = $conn->query("SELECT * FROM inventory ORDER BY name");
        echo json_encode($r->fetch_all(MYSQLI_ASSOC));
        break;

    case 'add_inventory':
        $stmt = $conn->prepare(
            "INSERT INTO inventory (id, name, qty, unit, min_qty) VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("ssdsd", $body['id'], $body['name'], $body['qty'], $body['unit'], $body['min']);
        $ok = $stmt->execute();
        echo json_encode(["ok" => $ok]);
        break;

    case 'update_inventory_qty':
        $stmt = $conn->prepare("UPDATE inventory SET qty = ? WHERE id = ?");
        $stmt->bind_param("ds", $body['qty'], $body['id']);
        $ok = $stmt->execute();
        echo json_encode(["ok" => $ok]);
        break;

    case 'delete_inventory':
        $id = $conn->real_escape_string($_GET['id']);
        $ok = $conn->query("DELETE FROM inventory WHERE id = '$id'");
        echo json_encode(["ok" => $ok]);
        break;

    // ════════════════════════════════════════════
    //  GASTOS
    // ════════════════════════════════════════════

    case 'get_expenses':
        $r = $conn->query("SELECT * FROM expenses ORDER BY created_at DESC LIMIT 200");
        echo json_encode($r->fetch_all(MYSQLI_ASSOC));
        break;

    case 'add_expense':
        $stmt = $conn->prepare(
            "INSERT INTO expenses (id, expense_date, expense_time, description, amount, category) VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param(
            "ssssds",
            $body['id'], $body['date'], $body['time'],
            $body['desc'], $body['amount'], $body['cat']
        );
        $ok = $stmt->execute();
        echo json_encode(["ok" => $ok]);
        break;

    case 'delete_expense':
        $id = $conn->real_escape_string($_GET['id']);
        $ok = $conn->query("DELETE FROM expenses WHERE id = '$id'");
        echo json_encode(["ok" => $ok]);
        break;

    // ════════════════════════════════════════════
    //  REPORTE: Ventas por día (últimos 7 días)
    // ════════════════════════════════════════════

    case 'get_chart_data':
        $r = $conn->query("
            SELECT sale_date, SUM(total) as total
            FROM sales
            WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY sale_date
            ORDER BY sale_date ASC
        ");
        echo json_encode($r->fetch_all(MYSQLI_ASSOC));
        break;

    default:
        http_response_code(400);
        echo json_encode(["error" => "Acción '$action' no reconocida"]);
        break;
}

$conn->close();
?>
