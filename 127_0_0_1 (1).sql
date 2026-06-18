-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 26-05-2026 a las 14:51:24
-- Versión del servidor: 11.4.9-MariaDB-ubu2204
-- Versión de PHP: 8.1.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `ultimatepos`
--
CREATE DATABASE IF NOT EXISTS `ultimatepos` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `ultimatepos`;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `accounts`
--

CREATE TABLE `accounts` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `account_number` varchar(191) NOT NULL,
  `account_details` text DEFAULT NULL,
  `account_type_id` int(11) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `is_closed` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `account_transactions`
--

CREATE TABLE `account_transactions` (
  `id` int(10) UNSIGNED NOT NULL,
  `account_id` int(11) NOT NULL,
  `type` enum('debit','credit') NOT NULL,
  `sub_type` enum('opening_balance','fund_transfer','deposit') DEFAULT NULL,
  `amount` decimal(22,4) NOT NULL,
  `reff_no` varchar(191) DEFAULT NULL,
  `operation_date` datetime NOT NULL,
  `created_by` int(11) NOT NULL,
  `transaction_id` int(11) DEFAULT NULL,
  `transaction_payment_id` int(11) DEFAULT NULL,
  `transfer_transaction_id` int(11) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `account_types`
--

CREATE TABLE `account_types` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `parent_account_type_id` int(11) DEFAULT NULL,
  `business_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `activity_log`
--

CREATE TABLE `activity_log` (
  `id` int(10) UNSIGNED NOT NULL,
  `log_name` varchar(191) DEFAULT NULL,
  `description` text NOT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `subject_type` varchar(191) DEFAULT NULL,
  `event` varchar(191) DEFAULT NULL,
  `business_id` int(11) DEFAULT NULL,
  `causer_id` int(11) DEFAULT NULL,
  `causer_type` varchar(191) DEFAULT NULL,
  `properties` text DEFAULT NULL,
  `batch_uuid` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `activity_log`
--

INSERT INTO `activity_log` (`id`, `log_name`, `description`, `subject_id`, `subject_type`, `event`, `business_id`, `causer_id`, `causer_type`, `properties`, `batch_uuid`, `created_at`, `updated_at`) VALUES
(1, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-10-28 18:21:12', '2025-10-28 18:21:12'),
(2, 'default', 'logout', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-10-28 18:23:39', '2025-10-28 18:23:39'),
(3, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-10-28 18:23:44', '2025-10-28 18:23:44'),
(4, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-10-28 23:39:54', '2025-10-28 23:39:54'),
(5, 'default', 'added', 8, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"paid\",\"final_total\":125}}', NULL, '2025-10-28 23:41:10', '2025-10-28 23:41:10'),
(6, 'default', 'added', 9, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell_return\",\"final_total\":0}}', NULL, '2025-10-28 23:42:01', '2025-10-28 23:42:01'),
(7, 'default', 'edited', 9, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell_return\",\"payment_status\":\"paid\",\"final_total\":125},\"old\":{\"type\":\"sell_return\",\"payment_status\":\"paid\",\"final_total\":\"0.0000\"}}', NULL, '2025-10-28 23:46:22', '2025-10-28 23:46:22'),
(8, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-10-29 08:38:43', '2025-10-29 08:38:43'),
(9, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-10-29 17:16:41', '2025-10-29 17:16:41'),
(10, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-11-02 10:49:27', '2025-11-02 10:49:27'),
(11, 'default', 'added', 2, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-11-02 11:00:02', '2025-11-02 11:00:02'),
(12, 'default', 'added', 10, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"due\",\"final_total\":312.5}}', NULL, '2025-11-02 11:00:27', '2025-11-02 11:00:27'),
(13, 'default', 'added', 11, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell_return\",\"final_total\":312.5}}', NULL, '2025-11-02 11:01:27', '2025-11-02 11:01:27'),
(14, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-11-09 10:21:22', '2025-11-09 10:21:22'),
(15, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-11-15 12:05:08', '2025-11-15 12:05:08'),
(16, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-11-15 18:53:30', '2025-11-15 18:53:30'),
(17, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-11-22 10:33:19', '2025-11-22 10:33:19'),
(18, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-11-24 12:42:00', '2025-11-24 12:42:00'),
(19, 'default', 'added', 2, 'App\\User', NULL, 1, 1, 'App\\User', '{\"name\":\" Romina Elvira\"}', NULL, '2025-11-24 17:25:40', '2025-11-24 17:25:40'),
(20, 'default', 'login', 2, 'App\\User', NULL, 1, 2, 'App\\User', '[]', NULL, '2025-11-24 19:10:28', '2025-11-24 19:10:28'),
(21, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-11-25 21:49:11', '2025-11-25 21:49:11'),
(22, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-11-26 20:08:40', '2025-11-26 20:08:40'),
(23, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-11-30 15:36:48', '2025-11-30 15:36:48'),
(24, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-11-30 21:47:19', '2025-11-30 21:47:19'),
(25, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-01 22:15:18', '2025-12-01 22:15:18'),
(26, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-02 22:32:07', '2025-12-02 22:32:07'),
(27, 'default', 'added', 3, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-02 23:11:03', '2025-12-02 23:11:03'),
(28, 'default', 'added', 12, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"ordered\",\"payment_status\":\"due\",\"final_total\":434000}}', NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(29, 'default', 'payment_edited', 12, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"ordered\",\"payment_status\":\"paid\",\"final_total\":\"434000.0000\"},\"old\":{\"type\":\"purchase\",\"status\":\"ordered\",\"payment_status\":\"due\",\"final_total\":\"434000.0000\"}}', NULL, '2025-12-02 23:21:38', '2025-12-02 23:21:38'),
(30, 'default', 'added', 4, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-02 23:24:48', '2025-12-02 23:24:48'),
(31, 'default', 'added', 13, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":126660}}', NULL, '2025-12-02 23:32:09', '2025-12-02 23:32:09'),
(32, 'default', 'payment_edited', 13, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"paid\",\"final_total\":\"126660.0000\"},\"old\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":\"126660.0000\"}}', NULL, '2025-12-02 23:32:25', '2025-12-02 23:32:25'),
(33, 'default', 'added', 5, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-02 23:33:28', '2025-12-02 23:33:28'),
(34, 'default', 'added', 14, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"pending\",\"payment_status\":\"due\",\"final_total\":192000}}', NULL, '2025-12-02 23:36:39', '2025-12-02 23:36:39'),
(35, 'default', 'edited', 5, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-02 23:37:28', '2025-12-02 23:37:28'),
(36, 'default', 'edited', 5, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-02 23:37:51', '2025-12-02 23:37:51'),
(37, 'default', 'added', 6, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-02 23:38:53', '2025-12-02 23:38:53'),
(38, 'default', 'added', 15, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"pending\",\"payment_status\":\"due\",\"final_total\":285365}}', NULL, '2025-12-02 23:45:18', '2025-12-02 23:45:18'),
(39, 'default', 'added', 7, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-02 23:45:58', '2025-12-02 23:45:58'),
(40, 'default', 'added', 16, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"pending\",\"payment_status\":\"due\",\"final_total\":505780.2}}', NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(41, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-03 12:57:13', '2025-12-03 12:57:13'),
(42, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-03 21:45:51', '2025-12-03 21:45:51'),
(43, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-04 21:45:30', '2025-12-04 21:45:30'),
(44, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-06 09:33:50', '2025-12-06 09:33:50'),
(45, 'default', 'added', 8, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-06 09:38:20', '2025-12-06 09:38:20'),
(46, 'default', 'added', 17, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"pending\",\"payment_status\":\"due\",\"final_total\":567100}}', NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(47, 'default', 'added', 9, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-06 09:47:20', '2025-12-06 09:47:20'),
(48, 'default', 'added', 18, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"pending\",\"payment_status\":\"due\",\"final_total\":577928.04}}', NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:08'),
(49, 'default', 'edited', 18, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":577928.04},\"old\":{\"type\":\"purchase\",\"status\":\"pending\",\"payment_status\":\"due\",\"final_total\":\"577928.0400\"}}', NULL, '2025-12-06 10:12:32', '2025-12-06 10:12:32'),
(50, 'default', 'payment_edited', 18, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"paid\",\"final_total\":\"577928.0400\"},\"old\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":\"577928.0400\"}}', NULL, '2025-12-06 10:12:46', '2025-12-06 10:12:46'),
(51, 'default', 'added', 10, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-06 10:17:23', '2025-12-06 10:17:23'),
(52, 'default', 'added', 19, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"pending\",\"payment_status\":\"due\",\"final_total\":378590}}', NULL, '2025-12-06 10:21:33', '2025-12-06 10:21:33'),
(53, 'default', 'added', 11, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-06 10:28:11', '2025-12-06 10:28:11'),
(54, 'default', 'added', 20, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"pending\",\"payment_status\":\"due\",\"final_total\":522600}}', NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(55, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-07 12:22:42', '2025-12-07 12:22:42'),
(56, 'default', 'added', 12, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-07 18:55:50', '2025-12-07 18:55:50'),
(57, 'default', 'added', 21, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"pending\",\"payment_status\":\"due\",\"final_total\":493500}}', NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(58, 'default', 'payment_edited', 21, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"pending\",\"payment_status\":\"paid\",\"final_total\":\"493500.0000\"},\"old\":{\"type\":\"purchase\",\"status\":\"pending\",\"payment_status\":\"due\",\"final_total\":\"493500.0000\"}}', NULL, '2025-12-07 19:00:40', '2025-12-07 19:00:40'),
(59, 'default', 'added', 13, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-07 19:03:50', '2025-12-07 19:03:50'),
(60, 'default', 'added', 22, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"pending\",\"payment_status\":\"due\",\"final_total\":415100}}', NULL, '2025-12-07 19:10:22', '2025-12-07 19:10:22'),
(61, 'default', 'added', 14, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-07 20:04:12', '2025-12-07 20:04:12'),
(62, 'default', 'added', 23, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":311000}}', NULL, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(63, 'default', 'added', 15, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-07 20:14:36', '2025-12-07 20:14:36'),
(64, 'default', 'added', 24, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":504200}}', NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(65, 'default', 'added', 25, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":269300}}', NULL, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(66, 'default', 'added', 16, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-07 21:15:01', '2025-12-07 21:15:01'),
(67, 'default', 'added', 26, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":984000}}', NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(68, 'default', 'login', 2, 'App\\User', NULL, 1, 2, 'App\\User', '[]', NULL, '2025-12-08 17:17:41', '2025-12-08 17:17:41'),
(69, 'default', 'added', 27, 'App\\Transaction', NULL, 1, 2, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"paid\",\"final_total\":38500}}', NULL, '2025-12-08 17:25:11', '2025-12-08 17:25:11'),
(70, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-08 19:46:27', '2025-12-08 19:46:27'),
(71, 'default', 'sell_deleted', 10, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"id\":10,\"invoice_no\":\"0002\",\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"due\",\"final_total\":\"312.5000\"}}', NULL, '2025-12-08 19:47:19', '2025-12-08 19:47:19'),
(72, 'default', 'sell_deleted', 8, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"id\":8,\"invoice_no\":\"0001\",\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"paid\",\"final_total\":\"125.0000\"}}', NULL, '2025-12-08 19:47:24', '2025-12-08 19:47:24'),
(73, 'default', 'added', 17, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-08 19:48:14', '2025-12-08 19:48:14'),
(74, 'default', 'added', 28, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"due\",\"final_total\":120050}}', NULL, '2025-12-08 19:54:14', '2025-12-08 19:54:14'),
(75, 'default', 'login', 2, 'App\\User', NULL, 1, 2, 'App\\User', '[]', NULL, '2025-12-17 19:34:07', '2025-12-17 19:34:07'),
(76, 'default', 'login', 2, 'App\\User', NULL, 1, 2, 'App\\User', '[]', NULL, '2025-12-19 00:45:53', '2025-12-19 00:45:53'),
(77, 'default', 'login', 2, 'App\\User', NULL, 1, 2, 'App\\User', '[]', NULL, '2025-12-19 16:20:56', '2025-12-19 16:20:56'),
(78, 'default', 'login', 2, 'App\\User', NULL, 1, 2, 'App\\User', '[]', NULL, '2025-12-21 14:08:51', '2025-12-21 14:08:51'),
(79, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-21 22:52:22', '2025-12-21 22:52:22'),
(80, 'default', 'added', 29, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"paid\",\"final_total\":30000}}', NULL, '2025-12-21 22:54:08', '2025-12-21 22:54:08'),
(81, 'default', 'added', 30, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"paid\",\"final_total\":47800}}', NULL, '2025-12-21 22:59:46', '2025-12-21 22:59:46'),
(82, 'default', 'added', 18, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-21 23:01:03', '2025-12-21 23:01:03'),
(83, 'default', 'added', 31, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"partial\",\"final_total\":110000}}', NULL, '2025-12-21 23:13:37', '2025-12-21 23:13:37'),
(84, 'default', 'added', 19, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-21 23:14:41', '2025-12-21 23:14:41'),
(85, 'default', 'added', 32, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"due\",\"final_total\":67000}}', NULL, '2025-12-21 23:17:48', '2025-12-21 23:17:48'),
(86, 'default', 'payment_edited', 28, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"partial\",\"final_total\":\"120050.0000\"},\"old\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"due\",\"final_total\":\"120050.0000\"}}', NULL, '2025-12-21 23:20:25', '2025-12-21 23:20:25'),
(87, 'default', 'edited', 28, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"partial\",\"final_total\":127000},\"old\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"partial\",\"final_total\":\"120050.0000\"}}', NULL, '2025-12-21 23:22:45', '2025-12-21 23:22:45'),
(88, 'default', 'added', 20, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-21 23:25:15', '2025-12-21 23:25:15'),
(89, 'default', 'added', 36, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"partial\",\"final_total\":122000}}', NULL, '2025-12-21 23:37:22', '2025-12-21 23:37:23'),
(90, 'default', 'added', 21, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-21 23:42:55', '2025-12-21 23:42:55'),
(91, 'default', 'added', 37, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"partial\",\"final_total\":23000}}', NULL, '2025-12-21 23:45:11', '2025-12-21 23:45:11'),
(92, 'default', 'edited', 31, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"partial\",\"final_total\":122000},\"old\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"partial\",\"final_total\":\"110000.0000\"}}', NULL, '2025-12-22 00:24:56', '2025-12-22 00:24:56'),
(93, 'default', 'login', 2, 'App\\User', NULL, 1, 2, 'App\\User', '[]', NULL, '2025-12-26 13:51:44', '2025-12-26 13:51:44'),
(94, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-26 16:33:28', '2025-12-26 16:33:28'),
(95, 'default', 'added', 42, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":295100}}', NULL, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(96, 'default', 'payment_edited', 42, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"paid\",\"final_total\":\"295100.0000\"},\"old\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":\"295100.0000\"}}', NULL, '2025-12-26 16:42:52', '2025-12-26 16:42:52'),
(97, 'default', 'payment_edited', 26, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"paid\",\"final_total\":\"984000.0000\"},\"old\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":\"984000.0000\"}}', NULL, '2025-12-26 16:43:01', '2025-12-26 16:43:01'),
(98, 'default', 'payment_edited', 25, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"paid\",\"final_total\":\"269300.0000\"},\"old\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":\"269300.0000\"}}', NULL, '2025-12-26 16:43:16', '2025-12-26 16:43:16'),
(99, 'default', 'payment_edited', 24, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"paid\",\"final_total\":\"504200.0000\"},\"old\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":\"504200.0000\"}}', NULL, '2025-12-26 16:43:23', '2025-12-26 16:43:23'),
(100, 'default', 'payment_edited', 23, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"paid\",\"final_total\":\"311000.0000\"},\"old\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":\"311000.0000\"}}', NULL, '2025-12-26 16:43:29', '2025-12-26 16:43:29'),
(101, 'default', 'payment_edited', 22, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"paid\",\"final_total\":\"415100.0000\"},\"old\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":\"415100.0000\"}}', NULL, '2025-12-26 16:43:37', '2025-12-26 16:43:37'),
(102, 'default', 'payment_edited', 20, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"paid\",\"final_total\":\"522600.0000\"},\"old\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":\"522600.0000\"}}', NULL, '2025-12-26 16:43:45', '2025-12-26 16:43:45'),
(103, 'default', 'payment_edited', 19, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"paid\",\"final_total\":\"378590.0000\"},\"old\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":\"378590.0000\"}}', NULL, '2025-12-26 16:43:53', '2025-12-26 16:43:53'),
(104, 'default', 'payment_edited', 17, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"paid\",\"final_total\":\"567100.0000\"},\"old\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":\"567100.0000\"}}', NULL, '2025-12-26 16:44:01', '2025-12-26 16:44:01'),
(105, 'default', 'payment_edited', 16, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"paid\",\"final_total\":\"505780.2000\"},\"old\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":\"505780.2000\"}}', NULL, '2025-12-26 16:44:10', '2025-12-26 16:44:10'),
(106, 'default', 'payment_edited', 14, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"paid\",\"final_total\":\"192000.0000\"},\"old\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":\"192000.0000\"}}', NULL, '2025-12-26 16:44:19', '2025-12-26 16:44:19'),
(107, 'default', 'payment_edited', 15, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"paid\",\"final_total\":\"285365.0000\"},\"old\":{\"type\":\"purchase\",\"status\":\"received\",\"payment_status\":\"due\",\"final_total\":\"285365.0000\"}}', NULL, '2025-12-26 16:44:28', '2025-12-26 16:44:28'),
(108, 'default', 'login', 2, 'App\\User', NULL, 1, 2, 'App\\User', '[]', NULL, '2025-12-27 19:36:46', '2025-12-27 19:36:46'),
(109, 'default', 'logout', 2, 'App\\User', NULL, 1, 2, 'App\\User', '[]', NULL, '2025-12-27 20:03:41', '2025-12-27 20:03:41'),
(110, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-27 20:03:47', '2025-12-27 20:03:47'),
(111, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-27 22:18:35', '2025-12-27 22:18:35'),
(112, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-28 18:26:05', '2025-12-28 18:26:05'),
(113, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-30 01:18:12', '2025-12-30 01:18:12'),
(114, 'default', 'added', 22, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-30 01:20:39', '2025-12-30 01:20:39'),
(115, 'default', 'added', 43, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"partial\",\"final_total\":20000}}', NULL, '2025-12-30 01:21:19', '2025-12-30 01:21:19'),
(116, 'default', 'edited', 43, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"partial\",\"final_total\":36000},\"old\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"partial\",\"final_total\":\"20000.0000\"}}', NULL, '2025-12-30 01:24:03', '2025-12-30 01:24:03'),
(117, 'default', 'added', 23, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-30 01:24:39', '2025-12-30 01:24:39'),
(118, 'default', 'added', 44, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"partial\",\"final_total\":134000}}', NULL, '2025-12-30 01:32:36', '2025-12-30 01:32:36'),
(119, 'default', 'added', 24, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-30 01:33:16', '2025-12-30 01:33:16'),
(120, 'default', 'added', 45, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"due\",\"final_total\":82000}}', NULL, '2025-12-30 01:38:54', '2025-12-30 01:38:54'),
(121, 'default', 'edited', 37, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"partial\",\"final_total\":80750},\"old\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"partial\",\"final_total\":\"23000.0000\"}}', NULL, '2025-12-30 01:44:08', '2025-12-30 01:44:08'),
(122, 'default', 'added', 25, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-30 01:45:20', '2025-12-30 01:45:20'),
(123, 'default', 'added', 46, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"paid\",\"final_total\":43000}}', NULL, '2025-12-30 01:53:24', '2025-12-30 01:53:24'),
(124, 'default', 'edited', 46, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"partial\",\"final_total\":43000},\"old\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"paid\",\"final_total\":\"43000.0000\"}}', NULL, '2025-12-30 01:53:41', '2025-12-30 01:53:41'),
(125, 'default', 'login', 2, 'App\\User', NULL, 1, 2, 'App\\User', '[]', NULL, '2025-12-30 19:33:46', '2025-12-30 19:33:46'),
(126, 'default', 'login', 2, 'App\\User', NULL, 1, 2, 'App\\User', '[]', NULL, '2025-12-31 17:50:57', '2025-12-31 17:50:57'),
(127, 'default', 'added', 26, 'App\\Contact', NULL, 1, 1, 'App\\User', '[]', NULL, '2025-12-31 20:24:39', '2025-12-31 20:24:39'),
(128, 'default', 'added', 47, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"partial\",\"final_total\":112000}}', NULL, '2025-12-31 20:28:29', '2025-12-31 20:28:29'),
(129, 'default', 'login', 2, 'App\\User', NULL, 1, 2, 'App\\User', '[]', NULL, '2026-01-01 16:34:56', '2026-01-01 16:34:56'),
(130, 'default', 'added', 48, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"paid\",\"final_total\":40000}}', NULL, '2026-01-02 17:03:20', '2026-01-02 17:03:20'),
(131, 'default', 'payment_edited', 31, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"paid\",\"final_total\":\"122000.0000\"},\"old\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"partial\",\"final_total\":\"122000.0000\"}}', NULL, '2026-01-02 17:04:01', '2026-01-02 17:04:01'),
(132, 'default', 'login', 2, 'App\\User', NULL, 1, 2, 'App\\User', '[]', NULL, '2026-01-02 19:15:55', '2026-01-02 19:15:55'),
(133, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2026-01-03 01:45:17', '2026-01-03 01:45:17'),
(134, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2026-01-03 16:19:53', '2026-01-03 16:19:53'),
(135, 'default', 'added', 49, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"paid\",\"final_total\":35000}}', NULL, '2026-01-03 16:22:05', '2026-01-03 16:22:05'),
(136, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2026-01-04 13:21:32', '2026-01-04 13:21:32'),
(137, 'default', 'payment_edited', 43, 'App\\Transaction', NULL, 1, 1, 'App\\User', '{\"attributes\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"paid\",\"final_total\":\"36000.0000\"},\"old\":{\"type\":\"sell\",\"status\":\"final\",\"payment_status\":\"partial\",\"final_total\":\"36000.0000\"}}', NULL, '2026-01-04 17:05:35', '2026-01-04 17:05:35'),
(138, 'default', 'login', 2, 'App\\User', NULL, 1, 2, 'App\\User', '[]', NULL, '2026-03-23 13:09:51', '2026-03-23 13:09:51'),
(139, 'default', 'login', 2, 'App\\User', NULL, 1, 2, 'App\\User', '[]', NULL, '2026-03-23 23:39:56', '2026-03-23 23:39:56'),
(140, 'default', 'login', 2, 'App\\User', NULL, 1, 2, 'App\\User', '[]', NULL, '2026-03-24 17:14:47', '2026-03-24 17:14:47'),
(141, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2026-03-24 23:24:55', '2026-03-24 23:24:55'),
(142, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2026-04-02 20:40:41', '2026-04-02 20:40:41'),
(143, 'default', 'login', 1, 'App\\User', NULL, 1, 1, 'App\\User', '[]', NULL, '2026-04-17 14:01:03', '2026-04-17 14:01:03');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `barcodes`
--

CREATE TABLE `barcodes` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `width` double(22,4) DEFAULT NULL,
  `height` double(22,4) DEFAULT NULL,
  `paper_width` double(22,4) DEFAULT NULL,
  `paper_height` double(22,4) DEFAULT NULL,
  `top_margin` double(22,4) DEFAULT NULL,
  `left_margin` double(22,4) DEFAULT NULL,
  `row_distance` double(22,4) DEFAULT NULL,
  `col_distance` double(22,4) DEFAULT NULL,
  `stickers_in_one_row` int(11) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `is_continuous` tinyint(1) NOT NULL DEFAULT 0,
  `stickers_in_one_sheet` int(11) DEFAULT NULL,
  `business_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `barcodes`
--

INSERT INTO `barcodes` (`id`, `name`, `description`, `width`, `height`, `paper_width`, `paper_height`, `top_margin`, `left_margin`, `row_distance`, `col_distance`, `stickers_in_one_row`, `is_default`, `is_continuous`, `stickers_in_one_sheet`, `business_id`, `created_at`, `updated_at`) VALUES
(1, '20 Labels per Sheet', 'Sheet Size: 8.5\" x 11\", Label Size: 4\" x 1\", Labels per sheet: 20', 4.0000, 1.0000, 8.5000, 11.0000, 0.5000, 0.1250, 0.0000, 0.1875, 2, 0, 0, 20, NULL, '2017-12-18 06:13:44', '2017-12-18 06:13:44'),
(2, '30 Labels per sheet', 'Sheet Size: 8.5\" x 11\", Label Size: 2.625\" x 1\", Labels per sheet: 30', 2.6250, 1.0000, 8.5000, 11.0000, 0.5000, 0.1880, 0.0000, 0.1250, 3, 0, 0, 30, NULL, '2017-12-18 06:04:39', '2017-12-18 06:10:40'),
(3, '32 Labels per sheet', 'Sheet Size: 8.5\" x 11\", Label Size: 2\" x 1.25\", Labels per sheet: 32', 2.0000, 1.2500, 8.5000, 11.0000, 0.5000, 0.2500, 0.0000, 0.0000, 4, 0, 0, 32, NULL, '2017-12-18 05:55:40', '2017-12-18 05:55:40'),
(4, '40 Labels per sheet', 'Sheet Size: 8.5\" x 11\", Label Size: 2\" x 1\", Labels per sheet: 40', 2.0000, 1.0000, 8.5000, 11.0000, 0.5000, 0.2500, 0.0000, 0.0000, 4, 0, 0, 40, NULL, '2017-12-18 05:58:40', '2017-12-18 05:58:40'),
(5, '50 Labels per Sheet', 'Sheet Size: 8.5\" x 11\", Label Size: 1.5\" x 1\", Labels per sheet: 50', 1.5000, 1.0000, 8.5000, 11.0000, 0.5000, 0.5000, 0.0000, 0.0000, 5, 0, 0, 50, NULL, '2017-12-18 05:51:10', '2017-12-18 05:51:10'),
(6, 'Continuous Rolls - 31.75mm x 25.4mm', 'Label Size: 31.75mm x 25.4mm, Gap: 3.18mm', 1.2500, 1.0000, 1.2500, 0.0000, 0.1250, 0.0000, 0.1250, 0.0000, 1, 0, 1, NULL, NULL, '2017-12-18 05:51:10', '2017-12-18 05:51:10'),
(7, 'Ro etiquetas', NULL, 1.5700, 1.1800, 1.5700, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 1, 0, 1, 28, 1, '2025-12-01 23:05:12', '2025-12-01 23:05:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bookings`
--

CREATE TABLE `bookings` (
  `id` int(10) UNSIGNED NOT NULL,
  `contact_id` int(10) UNSIGNED NOT NULL,
  `waiter_id` int(10) UNSIGNED DEFAULT NULL,
  `table_id` int(10) UNSIGNED DEFAULT NULL,
  `correspondent_id` int(11) DEFAULT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `location_id` int(10) UNSIGNED NOT NULL,
  `booking_start` datetime NOT NULL,
  `booking_end` datetime NOT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `booking_status` varchar(191) NOT NULL,
  `booking_note` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `brands`
--

CREATE TABLE `brands` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `brands`
--

INSERT INTO `brands` (`id`, `business_id`, `name`, `description`, `created_by`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'Generico', NULL, 1, NULL, '2025-10-28 19:46:27', '2025-10-28 19:46:27'),
(2, 1, 'The Maker', NULL, 1, NULL, '2025-11-15 19:18:25', '2025-11-15 19:18:25'),
(3, 1, 'Short', NULL, 1, '2025-11-15 19:19:02', '2025-11-15 19:18:50', '2025-11-15 19:19:02'),
(4, 1, 'LSKMAN', NULL, 1, NULL, '2025-11-15 22:35:24', '2025-11-15 22:35:24'),
(5, 1, 'Pupé', NULL, 1, NULL, '2025-11-24 12:43:02', '2025-11-24 12:43:02'),
(6, 1, 'Clostudio', NULL, 1, NULL, '2025-11-24 13:53:43', '2025-11-24 13:53:43'),
(7, 1, 'Merci', NULL, 1, NULL, '2025-11-24 15:45:41', '2025-11-24 15:45:41'),
(8, 1, 'Cabana', NULL, 1, NULL, '2025-11-24 16:23:47', '2025-11-24 16:23:47'),
(9, 1, 'CC Jeans', NULL, 1, NULL, '2025-11-24 19:15:52', '2025-11-24 19:15:52'),
(10, 1, 'Rumba', NULL, 1, NULL, '2025-11-24 20:24:19', '2025-11-24 20:24:19'),
(11, 1, 'Arizona', NULL, 1, NULL, '2025-11-25 22:32:33', '2025-11-25 22:32:33'),
(12, 1, 'LSK', NULL, 1, NULL, '2025-11-26 20:37:02', '2025-11-26 20:37:02'),
(13, 1, 'Nissie', NULL, 1, NULL, '2025-11-30 16:06:24', '2025-11-30 16:06:40'),
(14, 1, 'Meferti', NULL, 1, NULL, '2025-11-30 17:01:01', '2025-11-30 17:01:01'),
(15, 1, 'Samara', NULL, 1, NULL, '2025-11-30 18:19:33', '2025-11-30 18:19:33'),
(16, 1, 'Mouk', NULL, 1, NULL, '2025-11-30 19:07:29', '2025-11-30 19:07:29'),
(17, 1, 'OnenOn', NULL, 1, NULL, '2025-12-02 22:34:12', '2025-12-02 22:34:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `business`
--

CREATE TABLE `business` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `currency_id` int(10) UNSIGNED NOT NULL,
  `start_date` date DEFAULT NULL,
  `tax_number_1` varchar(100) DEFAULT NULL,
  `tax_label_1` varchar(10) DEFAULT NULL,
  `tax_number_2` varchar(100) DEFAULT NULL,
  `tax_label_2` varchar(10) DEFAULT NULL,
  `code_label_1` varchar(191) DEFAULT NULL,
  `code_1` varchar(191) DEFAULT NULL,
  `code_label_2` varchar(191) DEFAULT NULL,
  `code_2` varchar(191) DEFAULT NULL,
  `default_sales_tax` int(10) UNSIGNED DEFAULT NULL,
  `default_profit_percent` double(5,2) NOT NULL DEFAULT 0.00,
  `owner_id` int(10) UNSIGNED NOT NULL,
  `time_zone` varchar(191) NOT NULL DEFAULT 'Asia/Kolkata',
  `fy_start_month` tinyint(4) NOT NULL DEFAULT 1,
  `accounting_method` enum('fifo','lifo','avco') NOT NULL DEFAULT 'fifo',
  `default_sales_discount` decimal(5,2) DEFAULT NULL,
  `sell_price_tax` enum('includes','excludes') NOT NULL DEFAULT 'includes',
  `logo` varchar(191) DEFAULT NULL,
  `sku_prefix` varchar(191) DEFAULT NULL,
  `enable_product_expiry` tinyint(1) NOT NULL DEFAULT 0,
  `expiry_type` enum('add_expiry','add_manufacturing') NOT NULL DEFAULT 'add_expiry',
  `on_product_expiry` enum('keep_selling','stop_selling','auto_delete') NOT NULL DEFAULT 'keep_selling',
  `stop_selling_before` int(11) NOT NULL COMMENT 'Stop selling expied item n days before expiry',
  `enable_tooltip` tinyint(1) NOT NULL DEFAULT 1,
  `purchase_in_diff_currency` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Allow purchase to be in different currency then the business currency',
  `purchase_currency_id` int(10) UNSIGNED DEFAULT NULL,
  `p_exchange_rate` decimal(20,3) NOT NULL DEFAULT 1.000,
  `transaction_edit_days` int(10) UNSIGNED NOT NULL DEFAULT 30,
  `stock_expiry_alert_days` int(10) UNSIGNED NOT NULL DEFAULT 30,
  `keyboard_shortcuts` text DEFAULT NULL,
  `pos_settings` text DEFAULT NULL,
  `essentials_settings` longtext DEFAULT NULL,
  `woocommerce_api_settings` text DEFAULT NULL,
  `woocommerce_skipped_orders` text DEFAULT NULL,
  `woocommerce_wh_oc_secret` varchar(191) DEFAULT NULL,
  `woocommerce_wh_ou_secret` varchar(191) DEFAULT NULL,
  `woocommerce_wh_od_secret` varchar(191) DEFAULT NULL,
  `woocommerce_wh_or_secret` varchar(191) DEFAULT NULL,
  `weighing_scale_setting` text NOT NULL COMMENT 'used to store the configuration of weighing scale',
  `enable_brand` tinyint(1) NOT NULL DEFAULT 1,
  `enable_category` tinyint(1) NOT NULL DEFAULT 1,
  `enable_sub_category` tinyint(1) NOT NULL DEFAULT 1,
  `enable_price_tax` tinyint(1) NOT NULL DEFAULT 1,
  `enable_purchase_status` tinyint(1) DEFAULT 1,
  `enable_lot_number` tinyint(1) NOT NULL DEFAULT 0,
  `default_unit` int(11) DEFAULT NULL,
  `enable_sub_units` tinyint(1) NOT NULL DEFAULT 0,
  `enable_racks` tinyint(1) NOT NULL DEFAULT 0,
  `enable_row` tinyint(1) NOT NULL DEFAULT 0,
  `enable_position` tinyint(1) NOT NULL DEFAULT 0,
  `enable_editing_product_from_purchase` tinyint(1) NOT NULL DEFAULT 1,
  `sales_cmsn_agnt` enum('logged_in_user','user','cmsn_agnt') DEFAULT NULL,
  `item_addition_method` tinyint(1) NOT NULL DEFAULT 1,
  `enable_inline_tax` tinyint(1) NOT NULL DEFAULT 1,
  `currency_symbol_placement` enum('before','after') NOT NULL DEFAULT 'before',
  `enabled_modules` text DEFAULT NULL,
  `date_format` varchar(191) NOT NULL DEFAULT 'm/d/Y',
  `time_format` enum('12','24') NOT NULL DEFAULT '24',
  `currency_precision` tinyint(4) NOT NULL DEFAULT 2,
  `quantity_precision` tinyint(4) NOT NULL DEFAULT 2,
  `ref_no_prefixes` text DEFAULT NULL,
  `theme_color` char(20) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `crm_settings` text DEFAULT NULL,
  `enable_rp` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'rp is the short form of reward points',
  `rp_name` varchar(191) DEFAULT NULL COMMENT 'rp is the short form of reward points',
  `amount_for_unit_rp` decimal(22,4) NOT NULL DEFAULT 1.0000 COMMENT 'rp is the short form of reward points',
  `min_order_total_for_rp` decimal(22,4) NOT NULL DEFAULT 1.0000 COMMENT 'rp is the short form of reward points',
  `max_rp_per_order` int(11) DEFAULT NULL COMMENT 'rp is the short form of reward points',
  `redeem_amount_per_unit_rp` decimal(22,4) NOT NULL DEFAULT 1.0000 COMMENT 'rp is the short form of reward points',
  `min_order_total_for_redeem` decimal(22,4) NOT NULL DEFAULT 1.0000 COMMENT 'rp is the short form of reward points',
  `min_redeem_point` int(11) DEFAULT NULL COMMENT 'rp is the short form of reward points',
  `max_redeem_point` int(11) DEFAULT NULL COMMENT 'rp is the short form of reward points',
  `rp_expiry_period` int(11) DEFAULT NULL COMMENT 'rp is the short form of reward points',
  `rp_expiry_type` enum('month','year') NOT NULL DEFAULT 'year' COMMENT 'rp is the short form of reward points',
  `email_settings` text DEFAULT NULL,
  `sms_settings` text DEFAULT NULL,
  `custom_labels` text DEFAULT NULL,
  `common_settings` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `business`
--

INSERT INTO `business` (`id`, `name`, `currency_id`, `start_date`, `tax_number_1`, `tax_label_1`, `tax_number_2`, `tax_label_2`, `code_label_1`, `code_1`, `code_label_2`, `code_2`, `default_sales_tax`, `default_profit_percent`, `owner_id`, `time_zone`, `fy_start_month`, `accounting_method`, `default_sales_discount`, `sell_price_tax`, `logo`, `sku_prefix`, `enable_product_expiry`, `expiry_type`, `on_product_expiry`, `stop_selling_before`, `enable_tooltip`, `purchase_in_diff_currency`, `purchase_currency_id`, `p_exchange_rate`, `transaction_edit_days`, `stock_expiry_alert_days`, `keyboard_shortcuts`, `pos_settings`, `essentials_settings`, `woocommerce_api_settings`, `woocommerce_skipped_orders`, `woocommerce_wh_oc_secret`, `woocommerce_wh_ou_secret`, `woocommerce_wh_od_secret`, `woocommerce_wh_or_secret`, `weighing_scale_setting`, `enable_brand`, `enable_category`, `enable_sub_category`, `enable_price_tax`, `enable_purchase_status`, `enable_lot_number`, `default_unit`, `enable_sub_units`, `enable_racks`, `enable_row`, `enable_position`, `enable_editing_product_from_purchase`, `sales_cmsn_agnt`, `item_addition_method`, `enable_inline_tax`, `currency_symbol_placement`, `enabled_modules`, `date_format`, `time_format`, `currency_precision`, `quantity_precision`, `ref_no_prefixes`, `theme_color`, `created_by`, `crm_settings`, `enable_rp`, `rp_name`, `amount_for_unit_rp`, `min_order_total_for_rp`, `max_rp_per_order`, `redeem_amount_per_unit_rp`, `min_order_total_for_redeem`, `min_redeem_point`, `max_redeem_point`, `rp_expiry_period`, `rp_expiry_type`, `email_settings`, `sms_settings`, `custom_labels`, `common_settings`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Ro Indumentaria', 4, '1969-12-31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 25.00, 1, 'America/Argentina/Mendoza', 1, 'fifo', 0.00, 'includes', '1762094448_diseno-sin-titulo.png', NULL, 0, 'add_expiry', 'keep_selling', 0, 1, 0, NULL, 1.000, 30, 30, '{\"pos\":{\"express_checkout\":\"shift+e\",\"pay_n_ckeckout\":\"shift+p\",\"draft\":\"shift+d\",\"cancel\":\"shift+c\",\"recent_product_quantity\":\"f2\",\"weighing_scale\":null,\"edit_discount\":\"shift+i\",\"edit_order_tax\":\"shift+t\",\"add_payment_row\":\"shift+r\",\"finalize_payment\":\"shift+f\",\"add_new_product\":\"f4\"}}', '{\"amount_rounding_method\":null,\"cmmsn_calculation_type\":\"invoice_value\",\"razor_pay_key_id\":null,\"razor_pay_key_secret\":null,\"stripe_public_key\":null,\"stripe_secret_key\":null,\"customer_display_screen\":\"1\",\"display_screen_heading\":null,\"cash_denominations\":null,\"enable_cash_denomination_on\":\"all_screens\",\"disable_pay_checkout\":0,\"disable_draft\":0,\"disable_express_checkout\":0,\"hide_product_suggestion\":0,\"hide_recent_trans\":0,\"disable_discount\":0,\"disable_order_tax\":0,\"is_pos_subtotal_editable\":0}', NULL, '{\"woocommerce_app_url\":\"https:\\/\\/roindumentaria.com\\/\",\"woocommerce_consumer_key\":\"ck_a4a96d431f1373bd8d91346c74042f54365b8863\",\"woocommerce_consumer_secret\":\"cs_bc7b33f3c340ecbbdf09e68e4c8eafc0eb8c65d1\",\"location_id\":\"1\",\"enable_auto_sync\":\"1\",\"default_tax_class\":null,\"product_tax_type\":\"inc\",\"default_selling_price_group\":null,\"sync_description_as\":\"long\",\"product_fields_for_create\":[\"category\",\"quantity\",\"image\"],\"manage_stock_for_create\":\"true\",\"in_stock_for_create\":\"true\",\"product_fields_for_update\":[\"price\",\"category\",\"quantity\",\"image\"],\"manage_stock_for_update\":\"true\",\"in_stock_for_update\":\"true\",\"order_statuses\":{\"pending\":null,\"processing\":null,\"on-hold\":null,\"completed\":null,\"cancelled\":null,\"refunded\":null,\"failed\":null,\"shipped\":null},\"shipping_statuses\":{\"pending\":null,\"processing\":null,\"on-hold\":null,\"completed\":null,\"cancelled\":null,\"refunded\":null,\"failed\":null,\"shipped\":null},\"woocommerce_wh_oc_secret\":null,\"woocommerce_wh_ou_secret\":null,\"woocommerce_wh_od_secret\":null,\"woocommerce_wh_or_secret\":null}', NULL, NULL, NULL, NULL, NULL, '{\"label_prefix\":null,\"product_sku_length\":\"4\",\"qty_length\":\"3\",\"qty_length_decimal\":\"2\"}', 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, NULL, 1, 0, 'before', '[\"purchases\",\"add_sale\",\"pos_sale\",\"stock_transfers\",\"stock_adjustment\",\"expenses\"]', 'm/d/Y', '24', 2, 2, '{\"purchase\":\"PO\",\"purchase_return\":null,\"purchase_requisition\":null,\"purchase_order\":null,\"stock_transfer\":\"ST\",\"stock_adjustment\":\"SA\",\"sell_return\":\"CN\",\"expense\":\"EP\",\"contacts\":\"CO\",\"purchase_payment\":\"PP\",\"sell_payment\":\"SP\",\"expense_payment\":null,\"business_location\":\"BL\",\"username\":null,\"subscription\":null,\"draft\":null,\"sales_order\":null}', NULL, NULL, NULL, 0, NULL, 1.0000, 1.0000, NULL, 1.0000, 1.0000, NULL, NULL, NULL, 'year', '{\"mail_driver\":\"smtp\",\"mail_host\":\"c2771170.ferozo.com\",\"mail_port\":\"465\",\"mail_username\":\"hola@roindumentaria.com\",\"mail_password\":\"F@cundo1998\",\"mail_encryption\":\"ssl\",\"mail_from_address\":\"hola@roindumentaria.com\",\"mail_from_name\":\"Ro Indumentaria\"}', '{\"sms_service\":\"other\",\"nexmo_key\":null,\"nexmo_secret\":null,\"nexmo_from\":null,\"twilio_sid\":null,\"twilio_token\":null,\"twilio_from\":null,\"url\":\"https:\\/\\/mpwa.to\\/send-message\",\"send_to_param_name\":\"number\",\"send_to_param_type\":\"string\",\"msg_param_name\":\"message\",\"request_method\":\"post\",\"data_parameter_type\":\"form-data\",\"header_1\":null,\"header_val_1\":null,\"header_2\":null,\"header_val_2\":null,\"header_3\":null,\"header_val_3\":null,\"param_1\":\"api_key\",\"param_val_1\":\"NKSNGTEtY2ZYihwXmlRntczjFUCUH8\",\"param_2\":\"sender\",\"param_val_2\":\"542634681520\",\"param_3\":null,\"param_val_3\":null,\"param_4\":null,\"param_val_4\":null,\"param_5\":null,\"param_val_5\":null,\"param_6\":null,\"param_val_6\":null,\"param_7\":null,\"param_val_7\":null,\"param_8\":null,\"param_val_8\":null,\"param_9\":null,\"param_val_9\":null,\"param_10\":null,\"param_val_10\":null}', '{\"payments\":{\"custom_pay_1\":null,\"custom_pay_2\":null,\"custom_pay_3\":null,\"custom_pay_4\":null,\"custom_pay_5\":null,\"custom_pay_6\":null,\"custom_pay_7\":null},\"contact\":{\"custom_field_1\":null,\"custom_field_2\":null,\"custom_field_3\":null,\"custom_field_4\":null,\"custom_field_5\":null,\"custom_field_6\":null,\"custom_field_7\":null,\"custom_field_8\":null,\"custom_field_9\":null,\"custom_field_10\":null},\"product\":{\"custom_field_1\":null,\"custom_field_2\":null,\"custom_field_3\":null,\"custom_field_4\":null,\"custom_field_5\":null,\"custom_field_6\":null,\"custom_field_7\":null,\"custom_field_8\":null,\"custom_field_9\":null,\"custom_field_10\":null,\"custom_field_11\":null,\"custom_field_12\":null,\"custom_field_13\":null,\"custom_field_14\":null,\"custom_field_15\":null,\"custom_field_16\":null,\"custom_field_17\":null,\"custom_field_18\":null,\"custom_field_19\":null,\"custom_field_20\":null},\"product_cf_details\":{\"1\":{\"type\":null,\"dropdown_options\":null},\"2\":{\"type\":null,\"dropdown_options\":null},\"3\":{\"type\":null,\"dropdown_options\":null},\"4\":{\"type\":null,\"dropdown_options\":null},\"5\":{\"type\":null,\"dropdown_options\":null},\"6\":{\"type\":null,\"dropdown_options\":null},\"7\":{\"type\":null,\"dropdown_options\":null},\"8\":{\"type\":null,\"dropdown_options\":null},\"9\":{\"type\":null,\"dropdown_options\":null},\"10\":{\"type\":null,\"dropdown_options\":null},\"11\":{\"type\":null,\"dropdown_options\":null},\"12\":{\"type\":null,\"dropdown_options\":null},\"13\":{\"type\":null,\"dropdown_options\":null},\"14\":{\"type\":null,\"dropdown_options\":null},\"15\":{\"type\":null,\"dropdown_options\":null},\"16\":{\"type\":null,\"dropdown_options\":null},\"17\":{\"type\":null,\"dropdown_options\":null},\"18\":{\"type\":null,\"dropdown_options\":null},\"19\":{\"type\":null,\"dropdown_options\":null},\"20\":{\"type\":null,\"dropdown_options\":null}},\"location\":{\"custom_field_1\":null,\"custom_field_2\":null,\"custom_field_3\":null,\"custom_field_4\":null},\"user\":{\"custom_field_1\":null,\"custom_field_2\":null,\"custom_field_3\":null,\"custom_field_4\":null},\"purchase\":{\"custom_field_1\":null,\"custom_field_2\":null,\"custom_field_3\":null,\"custom_field_4\":null},\"purchase_shipping\":{\"custom_field_1\":null,\"custom_field_2\":null,\"custom_field_3\":null,\"custom_field_4\":null,\"custom_field_5\":null},\"sell\":{\"custom_field_1\":null,\"custom_field_2\":null,\"custom_field_3\":null,\"custom_field_4\":null},\"shipping\":{\"custom_field_1\":null,\"custom_field_2\":null,\"custom_field_3\":null,\"custom_field_4\":null,\"custom_field_5\":null},\"types_of_service\":{\"custom_field_1\":null,\"custom_field_2\":null,\"custom_field_3\":null,\"custom_field_4\":null,\"custom_field_5\":null,\"custom_field_6\":null}}', '{\"default_credit_limit\":null,\"default_datatable_page_entries\":\"25\"}', 1, '2025-10-29 02:51:01', '2025-12-27 22:59:27');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `business_locations`
--

CREATE TABLE `business_locations` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `location_id` varchar(191) DEFAULT NULL,
  `name` varchar(256) NOT NULL,
  `landmark` text DEFAULT NULL,
  `country` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `city` varchar(100) NOT NULL,
  `zip_code` char(7) NOT NULL,
  `invoice_scheme_id` int(10) UNSIGNED NOT NULL,
  `sale_invoice_scheme_id` int(11) DEFAULT NULL,
  `invoice_layout_id` int(10) UNSIGNED NOT NULL,
  `sale_invoice_layout_id` int(11) DEFAULT NULL,
  `selling_price_group_id` int(11) DEFAULT NULL,
  `print_receipt_on_invoice` tinyint(1) DEFAULT 1,
  `receipt_printer_type` enum('browser','printer') NOT NULL DEFAULT 'browser',
  `printer_id` int(11) DEFAULT NULL,
  `mobile` varchar(191) DEFAULT NULL,
  `alternate_number` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `website` varchar(191) DEFAULT NULL,
  `featured_products` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `default_payment_accounts` text DEFAULT NULL,
  `custom_field1` varchar(191) DEFAULT NULL,
  `custom_field2` varchar(191) DEFAULT NULL,
  `custom_field3` varchar(191) DEFAULT NULL,
  `custom_field4` varchar(191) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `business_locations`
--

INSERT INTO `business_locations` (`id`, `business_id`, `location_id`, `name`, `landmark`, `country`, `state`, `city`, `zip_code`, `invoice_scheme_id`, `sale_invoice_scheme_id`, `invoice_layout_id`, `sale_invoice_layout_id`, `selling_price_group_id`, `print_receipt_on_invoice`, `receipt_printer_type`, `printer_id`, `mobile`, `alternate_number`, `email`, `website`, `featured_products`, `is_active`, `default_payment_accounts`, `custom_field1`, `custom_field2`, `custom_field3`, `custom_field4`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'BL0001', 'Ro Indumentaria', '1', 'Argentina', 'Mendoza', 'Palmira', '5584', 1, NULL, 1, 1, NULL, 1, 'browser', NULL, '', '', '', '', NULL, 1, '{\"cash\":{\"is_enabled\":1,\"account\":null},\"card\":{\"is_enabled\":1,\"account\":null},\"cheque\":{\"is_enabled\":1,\"account\":null},\"bank_transfer\":{\"is_enabled\":1,\"account\":null},\"other\":{\"is_enabled\":1,\"account\":null},\"custom_pay_1\":{\"is_enabled\":1,\"account\":null},\"custom_pay_2\":{\"is_enabled\":1,\"account\":null},\"custom_pay_3\":{\"is_enabled\":1,\"account\":null},\"custom_pay_4\":{\"is_enabled\":1,\"account\":null},\"custom_pay_5\":{\"is_enabled\":1,\"account\":null},\"custom_pay_6\":{\"is_enabled\":1,\"account\":null},\"custom_pay_7\":{\"is_enabled\":1,\"account\":null}}', NULL, NULL, NULL, NULL, NULL, '2025-10-29 02:51:02', '2025-10-29 02:51:02');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cash_denominations`
--

CREATE TABLE `cash_denominations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `business_id` int(11) NOT NULL,
  `amount` decimal(22,4) NOT NULL,
  `total_count` int(11) NOT NULL,
  `model_type` varchar(191) NOT NULL,
  `model_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cash_registers`
--

CREATE TABLE `cash_registers` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `location_id` int(11) DEFAULT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('close','open') NOT NULL DEFAULT 'open',
  `closed_at` datetime DEFAULT NULL,
  `closing_amount` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `total_card_slips` int(11) NOT NULL DEFAULT 0,
  `total_cheques` int(11) NOT NULL DEFAULT 0,
  `denominations` text DEFAULT NULL,
  `closing_note` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `cash_registers`
--

INSERT INTO `cash_registers` (`id`, `business_id`, `location_id`, `user_id`, `status`, `closed_at`, `closing_amount`, `total_card_slips`, `total_cheques`, `denominations`, `closing_note`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 'close', '2025-11-24 19:13:51', 125.0000, 0, 0, NULL, NULL, '2025-10-28 23:40:00', '2025-11-24 19:13:51'),
(2, 1, 1, 1, 'open', NULL, 0.0000, 0, 0, NULL, NULL, '2025-12-01 23:58:00', '2025-12-01 23:58:12'),
(3, 1, 1, 2, 'open', NULL, 0.0000, 0, 0, NULL, NULL, '2025-12-08 17:26:00', '2025-12-08 17:26:38');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cash_register_transactions`
--

CREATE TABLE `cash_register_transactions` (
  `id` int(10) UNSIGNED NOT NULL,
  `cash_register_id` int(10) UNSIGNED NOT NULL,
  `amount` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `pay_method` varchar(191) DEFAULT NULL,
  `type` enum('debit','credit') NOT NULL,
  `transaction_type` varchar(191) DEFAULT NULL,
  `transaction_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categories`
--

CREATE TABLE `categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `short_code` varchar(191) DEFAULT NULL,
  `parent_id` int(11) NOT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `woocommerce_cat_id` int(11) DEFAULT NULL,
  `category_type` varchar(191) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `slug` varchar(191) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `categories`
--

INSERT INTO `categories` (`id`, `name`, `business_id`, `short_code`, `parent_id`, `created_by`, `woocommerce_cat_id`, `category_type`, `description`, `slug`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 'Remeras', 1, NULL, 0, 1, 16, 'product', NULL, NULL, NULL, '2025-10-28 19:45:39', '2025-12-27 22:35:48'),
(2, 'Pantalones', 1, NULL, 0, 1, 17, 'product', NULL, NULL, NULL, '2025-10-28 19:45:54', '2025-12-27 22:35:48'),
(3, 'Buzos', 1, NULL, 0, 1, 18, 'product', NULL, NULL, NULL, '2025-10-28 19:46:15', '2025-12-27 22:35:48'),
(4, 'Shorts', 1, NULL, 0, 1, 19, 'product', NULL, NULL, NULL, '2025-11-15 19:19:18', '2025-12-27 22:35:48'),
(5, 'Puperas', 1, NULL, 0, 1, 20, 'product', NULL, NULL, NULL, '2025-11-15 19:19:26', '2025-12-27 22:35:48'),
(6, 'Puperones', 1, NULL, 0, 1, 21, 'product', NULL, NULL, NULL, '2025-11-15 19:19:32', '2025-12-27 22:35:48'),
(7, 'Minifaldas', 1, NULL, 0, 1, 22, 'product', NULL, NULL, NULL, '2025-11-15 19:19:40', '2025-12-27 22:35:48'),
(8, 'Conjuntos', 1, NULL, 0, 1, 23, 'product', NULL, NULL, NULL, '2025-11-15 19:19:54', '2025-12-27 22:35:48'),
(9, 'Musculosas', 1, NULL, 0, 1, 24, 'product', NULL, NULL, NULL, '2025-11-15 19:20:01', '2025-12-27 22:35:48'),
(10, 'Chombas', 1, NULL, 0, 1, 25, 'product', NULL, NULL, NULL, '2025-11-15 19:20:26', '2025-12-27 22:35:48'),
(11, 'Camisas', 1, NULL, 0, 1, 26, 'product', NULL, NULL, NULL, '2025-11-15 22:34:41', '2025-12-27 22:35:48'),
(12, 'Sudaderas', 1, NULL, 0, 1, 27, 'product', NULL, NULL, NULL, '2025-11-15 22:34:48', '2025-12-27 22:35:48'),
(13, 'Cinturones', 1, NULL, 0, 1, 28, 'product', NULL, NULL, NULL, '2025-11-24 12:43:28', '2025-12-27 22:35:48'),
(14, 'Tops', 1, NULL, 0, 1, 29, 'product', NULL, NULL, NULL, '2025-11-24 15:47:31', '2025-12-27 22:35:48'),
(15, 'Polleras', 1, NULL, 0, 1, 30, 'product', NULL, NULL, NULL, '2025-11-24 15:53:01', '2025-12-27 22:35:48'),
(16, 'Vestidos', 1, NULL, 0, 1, 31, 'product', NULL, NULL, NULL, '2025-11-24 15:53:13', '2025-12-27 22:35:48'),
(17, 'Sacos', 1, NULL, 0, 1, 32, 'product', NULL, NULL, NULL, '2025-11-24 15:57:39', '2025-12-27 22:35:48'),
(18, 'Blazers', 1, NULL, 0, 1, 33, 'product', NULL, NULL, NULL, '2025-11-24 16:05:36', '2025-12-27 22:35:48'),
(19, 'Camperas', 1, NULL, 0, 1, 34, 'product', NULL, NULL, NULL, '2025-11-24 20:27:48', '2025-12-27 22:35:48'),
(20, 'Blusas', 1, NULL, 0, 1, 35, 'product', NULL, NULL, NULL, '2025-11-25 22:55:29', '2025-12-27 22:35:48'),
(21, 'Chalecos', 1, NULL, 0, 1, 36, 'product', NULL, NULL, NULL, '2025-11-26 20:44:07', '2025-12-27 22:35:48'),
(22, 'Mallas', 1, NULL, 0, 1, 37, 'product', NULL, NULL, NULL, '2025-11-30 19:05:18', '2025-12-27 22:35:48'),
(23, 'Bermudas', 1, NULL, 0, 1, 38, 'product', NULL, NULL, NULL, '2025-11-30 21:58:30', '2025-12-27 22:35:48');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorizables`
--

CREATE TABLE `categorizables` (
  `category_id` int(11) NOT NULL,
  `categorizable_type` varchar(191) NOT NULL,
  `categorizable_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contacts`
--

CREATE TABLE `contacts` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `type` varchar(191) NOT NULL,
  `contact_type` varchar(191) DEFAULT NULL,
  `land_mark` varchar(191) DEFAULT NULL,
  `street_name` varchar(191) DEFAULT NULL,
  `building_number` varchar(191) DEFAULT NULL,
  `additional_number` varchar(191) DEFAULT NULL,
  `supplier_business_name` varchar(191) DEFAULT NULL,
  `name` varchar(191) DEFAULT NULL,
  `prefix` varchar(191) DEFAULT NULL,
  `first_name` varchar(191) DEFAULT NULL,
  `middle_name` varchar(191) DEFAULT NULL,
  `last_name` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `contact_id` varchar(191) DEFAULT NULL,
  `contact_status` varchar(191) NOT NULL DEFAULT 'active',
  `tax_number` varchar(191) DEFAULT NULL,
  `city` varchar(191) DEFAULT NULL,
  `state` varchar(191) DEFAULT NULL,
  `country` varchar(191) DEFAULT NULL,
  `address_line_1` text DEFAULT NULL,
  `address_line_2` text DEFAULT NULL,
  `zip_code` varchar(191) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `mobile` varchar(191) NOT NULL,
  `landline` varchar(191) DEFAULT NULL,
  `alternate_number` varchar(191) DEFAULT NULL,
  `pay_term_number` int(11) DEFAULT NULL,
  `pay_term_type` enum('days','months') DEFAULT NULL,
  `credit_limit` decimal(22,4) DEFAULT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `converted_by` int(11) DEFAULT NULL,
  `converted_on` datetime DEFAULT NULL,
  `balance` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `total_rp` int(11) NOT NULL DEFAULT 0 COMMENT 'rp is the short form of reward points',
  `total_rp_used` int(11) NOT NULL DEFAULT 0 COMMENT 'rp is the short form of reward points',
  `total_rp_expired` int(11) NOT NULL DEFAULT 0 COMMENT 'rp is the short form of reward points',
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `shipping_address` text DEFAULT NULL,
  `shipping_custom_field_details` longtext DEFAULT NULL,
  `is_export` tinyint(1) NOT NULL DEFAULT 0,
  `export_custom_field_1` varchar(191) DEFAULT NULL,
  `export_custom_field_2` varchar(191) DEFAULT NULL,
  `export_custom_field_3` varchar(191) DEFAULT NULL,
  `export_custom_field_4` varchar(191) DEFAULT NULL,
  `export_custom_field_5` varchar(191) DEFAULT NULL,
  `export_custom_field_6` varchar(191) DEFAULT NULL,
  `position` varchar(191) DEFAULT NULL,
  `customer_group_id` int(11) DEFAULT NULL,
  `crm_source` varchar(191) DEFAULT NULL,
  `crm_life_stage` varchar(191) DEFAULT NULL,
  `custom_field1` varchar(191) DEFAULT NULL,
  `custom_field2` varchar(191) DEFAULT NULL,
  `custom_field3` varchar(191) DEFAULT NULL,
  `custom_field4` varchar(191) DEFAULT NULL,
  `custom_field5` varchar(191) DEFAULT NULL,
  `custom_field6` varchar(191) DEFAULT NULL,
  `custom_field7` varchar(191) DEFAULT NULL,
  `custom_field8` varchar(191) DEFAULT NULL,
  `custom_field9` varchar(191) DEFAULT NULL,
  `custom_field10` varchar(191) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `contacts`
--

INSERT INTO `contacts` (`id`, `business_id`, `type`, `contact_type`, `land_mark`, `street_name`, `building_number`, `additional_number`, `supplier_business_name`, `name`, `prefix`, `first_name`, `middle_name`, `last_name`, `email`, `contact_id`, `contact_status`, `tax_number`, `city`, `state`, `country`, `address_line_1`, `address_line_2`, `zip_code`, `dob`, `mobile`, `landline`, `alternate_number`, `pay_term_number`, `pay_term_type`, `credit_limit`, `created_by`, `converted_by`, `converted_on`, `balance`, `total_rp`, `total_rp_used`, `total_rp_expired`, `is_default`, `shipping_address`, `shipping_custom_field_details`, `is_export`, `export_custom_field_1`, `export_custom_field_2`, `export_custom_field_3`, `export_custom_field_4`, `export_custom_field_5`, `export_custom_field_6`, `position`, `customer_group_id`, `crm_source`, `crm_life_stage`, `custom_field1`, `custom_field2`, `custom_field3`, `custom_field4`, `custom_field5`, `custom_field6`, `custom_field7`, `custom_field8`, `custom_field9`, `custom_field10`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'customer', NULL, NULL, NULL, NULL, NULL, NULL, 'Walk-In Customer', NULL, NULL, NULL, NULL, NULL, 'CO0001', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, 0.0000, 1, NULL, NULL, 0.0000, 0, 0, 0, 1, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-29 02:51:01', '2025-10-29 02:51:01'),
(2, 1, 'customer', 'individual', NULL, NULL, NULL, NULL, NULL, 'Facundo Gomez', NULL, 'Facundo', NULL, 'Gomez', 'facu.gmz54@gmail.com', 'CO0002', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '5492634552962', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-02 11:00:02', '2025-11-02 11:00:02'),
(3, 1, 'supplier', 'business', NULL, NULL, NULL, NULL, 'OnenOn', '', NULL, NULL, NULL, NULL, NULL, 'CO0003', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '11111111', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-02 23:11:03', '2025-12-02 23:11:03'),
(4, 1, 'supplier', 'business', NULL, NULL, NULL, NULL, 'Pupe', '', NULL, NULL, NULL, NULL, NULL, 'CO0004', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '111111', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-02 23:24:48', '2025-12-02 23:24:48'),
(5, 1, 'supplier', 'business', NULL, NULL, NULL, NULL, 'Clostudio', '', NULL, NULL, NULL, NULL, NULL, 'CO0005', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '111', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-02 23:33:28', '2025-12-02 23:37:51'),
(6, 1, 'supplier', 'business', NULL, NULL, NULL, NULL, 'Merci', '', NULL, NULL, NULL, NULL, NULL, 'CO0006', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-02 23:38:53', '2025-12-02 23:38:53'),
(7, 1, 'supplier', 'business', NULL, NULL, NULL, NULL, 'Cabana', '', NULL, NULL, NULL, NULL, NULL, 'CO0007', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '0', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-02 23:45:58', '2025-12-02 23:45:58'),
(8, 1, 'supplier', 'business', NULL, NULL, NULL, NULL, 'CC Jeans', '', NULL, NULL, NULL, NULL, NULL, 'CO0008', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '0', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-06 09:38:20', '2025-12-06 09:38:20'),
(9, 1, 'supplier', 'business', NULL, NULL, NULL, NULL, 'Rumba', '', NULL, NULL, NULL, NULL, NULL, 'CO0009', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-06 09:47:20', '2025-12-06 09:47:20'),
(10, 1, 'supplier', 'business', NULL, NULL, NULL, NULL, 'Arizona', '', NULL, NULL, NULL, NULL, NULL, 'CO0010', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '4', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-06 10:17:23', '2025-12-06 10:17:23'),
(11, 1, 'supplier', 'business', NULL, NULL, NULL, NULL, 'Lushka', '', NULL, NULL, NULL, NULL, NULL, 'CO0011', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '8', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-06 10:28:11', '2025-12-06 10:28:11'),
(12, 1, 'supplier', 'business', NULL, NULL, NULL, NULL, 'Nissie Denim', '', NULL, NULL, NULL, NULL, NULL, 'CO0012', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '7', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-07 18:55:50', '2025-12-07 18:55:50'),
(13, 1, 'supplier', 'business', NULL, NULL, NULL, NULL, 'Meferti', '', NULL, NULL, NULL, NULL, NULL, 'CO0013', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '8', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-07 19:03:50', '2025-12-07 19:03:50'),
(14, 1, 'supplier', 'business', NULL, NULL, NULL, NULL, 'Samara', '', NULL, NULL, NULL, NULL, NULL, 'CO0014', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '9', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-07 20:04:12', '2025-12-07 20:04:12'),
(15, 1, 'supplier', 'business', NULL, NULL, NULL, NULL, 'The Maker', '', NULL, NULL, NULL, NULL, NULL, 'CO0015', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '99', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-07 20:14:36', '2025-12-07 20:14:36'),
(16, 1, 'supplier', 'business', NULL, NULL, NULL, NULL, 'Mouk', '', NULL, NULL, NULL, NULL, NULL, 'CO0016', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '88', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-07 21:15:01', '2025-12-07 21:15:01'),
(17, 1, 'customer', 'individual', NULL, NULL, NULL, NULL, NULL, 'Cecilia Elvira', NULL, 'Cecilia', NULL, 'Elvira', NULL, 'CO0017', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1', NULL, NULL, NULL, NULL, 200000.0000, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-08 19:48:14', '2025-12-08 19:48:14'),
(18, 1, 'customer', 'individual', NULL, NULL, NULL, NULL, NULL, 'Eugenia Torres', NULL, 'Eugenia', NULL, 'Torres', NULL, 'CO0018', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-21 23:01:03', '2025-12-21 23:01:03'),
(19, 1, 'customer', 'individual', NULL, NULL, NULL, NULL, NULL, 'Paula Zimino', NULL, 'Paula', NULL, 'Zimino', NULL, 'CO0019', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '44', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-21 23:14:41', '2025-12-21 23:14:41'),
(20, 1, 'customer', 'individual', NULL, NULL, NULL, NULL, NULL, 'Melisa Aguiar', NULL, 'Melisa', NULL, 'Aguiar', NULL, 'CO0020', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '153', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-21 23:25:15', '2025-12-21 23:25:15'),
(21, 1, 'customer', 'individual', NULL, NULL, NULL, NULL, NULL, 'Romina Elvira', NULL, 'Romina', NULL, 'Elvira', NULL, 'CO0021', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '+5492634870093', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-21 23:42:55', '2025-12-21 23:42:55'),
(22, 1, 'customer', 'individual', NULL, NULL, NULL, NULL, NULL, 'Clelia Sevilla', NULL, 'Clelia', NULL, 'Sevilla', NULL, 'CO0022', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '45', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-30 01:20:39', '2025-12-30 01:20:39'),
(23, 1, 'customer', 'individual', NULL, NULL, NULL, NULL, NULL, 'Miriam Benitez', NULL, 'Miriam', NULL, 'Benitez', NULL, 'CO0023', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '12346', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-30 01:24:39', '2025-12-30 01:24:39'),
(24, 1, 'customer', 'individual', NULL, NULL, NULL, NULL, NULL, 'Laura Elvira', NULL, 'Laura', NULL, 'Elvira', NULL, 'CO0024', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '123456', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-30 01:33:16', '2025-12-30 01:33:16'),
(25, 1, 'customer', 'individual', NULL, NULL, NULL, NULL, NULL, 'Alejandra Perri', NULL, 'Alejandra', NULL, 'Perri', NULL, 'CO0025', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '7454', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-30 01:45:20', '2025-12-30 01:45:20'),
(26, 1, 'customer', 'individual', NULL, NULL, NULL, NULL, NULL, 'Laura Ravera', NULL, 'Laura', NULL, 'Ravera', NULL, 'CO0026', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '72849', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 0.0000, 0, 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-31 20:24:39', '2025-12-31 20:24:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `crm_call_logs`
--

CREATE TABLE `crm_call_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `business_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `call_type` varchar(191) DEFAULT NULL,
  `mobile_number` varchar(191) NOT NULL,
  `mobile_name` varchar(191) DEFAULT NULL,
  `contact_id` int(11) DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `crm_campaigns`
--

CREATE TABLE `crm_campaigns` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `campaign_type` enum('sms','email') NOT NULL DEFAULT 'email',
  `subject` varchar(191) DEFAULT NULL,
  `email_body` text DEFAULT NULL,
  `sms_body` text DEFAULT NULL,
  `sent_on` datetime DEFAULT NULL,
  `contact_ids` text NOT NULL,
  `additional_info` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `crm_contact_person_commissions`
--

CREATE TABLE `crm_contact_person_commissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `contact_person_id` int(11) NOT NULL,
  `transaction_id` int(11) DEFAULT NULL,
  `commission_amount` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `crm_followup_invoices`
--

CREATE TABLE `crm_followup_invoices` (
  `follow_up_id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `crm_lead_users`
--

CREATE TABLE `crm_lead_users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `contact_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `crm_marketplaces`
--

CREATE TABLE `crm_marketplaces` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `business_id` int(11) NOT NULL,
  `marketplace` varchar(191) DEFAULT NULL,
  `site_key` varchar(191) DEFAULT NULL,
  `site_id` varchar(191) DEFAULT NULL,
  `assigned_users` text DEFAULT NULL,
  `crm_source_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `crm_proposals`
--

CREATE TABLE `crm_proposals` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `contact_id` int(10) UNSIGNED NOT NULL,
  `subject` text NOT NULL,
  `body` longtext NOT NULL,
  `cc` text DEFAULT NULL,
  `bcc` text DEFAULT NULL,
  `sent_by` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `crm_proposal_templates`
--

CREATE TABLE `crm_proposal_templates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `subject` text NOT NULL,
  `body` longtext NOT NULL,
  `cc` text DEFAULT NULL,
  `bcc` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `crm_schedules`
--

CREATE TABLE `crm_schedules` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `contact_id` int(10) DEFAULT NULL,
  `title` varchar(191) NOT NULL,
  `status` varchar(191) DEFAULT NULL,
  `start_datetime` datetime DEFAULT NULL,
  `end_datetime` datetime DEFAULT NULL,
  `description` text DEFAULT NULL,
  `schedule_type` enum('call','sms','meeting','email') NOT NULL DEFAULT 'email',
  `followup_category_id` int(11) DEFAULT NULL,
  `allow_notification` tinyint(1) NOT NULL DEFAULT 1,
  `notify_via` text DEFAULT NULL,
  `notify_before` int(11) DEFAULT NULL,
  `notify_type` enum('minute','hour','day') NOT NULL DEFAULT 'hour',
  `created_by` int(11) NOT NULL,
  `is_recursive` tinyint(1) NOT NULL DEFAULT 0,
  `recursion_days` int(11) DEFAULT NULL,
  `followup_additional_info` text DEFAULT NULL,
  `follow_up_by` varchar(191) DEFAULT NULL,
  `follow_up_by_value` varchar(191) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `crm_schedule_logs`
--

CREATE TABLE `crm_schedule_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `schedule_id` bigint(20) UNSIGNED NOT NULL,
  `log_type` enum('call','sms','meeting','email') NOT NULL DEFAULT 'email',
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `subject` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `crm_schedule_users`
--

CREATE TABLE `crm_schedule_users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `schedule_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `currencies`
--

CREATE TABLE `currencies` (
  `id` int(10) UNSIGNED NOT NULL,
  `country` varchar(100) NOT NULL,
  `currency` varchar(100) NOT NULL,
  `code` varchar(25) NOT NULL,
  `symbol` varchar(25) NOT NULL,
  `thousand_separator` varchar(10) NOT NULL,
  `decimal_separator` varchar(10) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `currencies`
--

INSERT INTO `currencies` (`id`, `country`, `currency`, `code`, `symbol`, `thousand_separator`, `decimal_separator`, `created_at`, `updated_at`) VALUES
(1, 'Albania', 'Leke', 'ALL', 'Lek', ',', '.', NULL, NULL),
(2, 'America', 'Dollars', 'USD', '$', ',', '.', NULL, NULL),
(3, 'Afghanistan', 'Afghanis', 'AF', '؋', ',', '.', NULL, NULL),
(4, 'Argentina', 'Pesos', 'ARS', '$', ',', '.', NULL, NULL),
(5, 'Aruba', 'Guilders', 'AWG', 'ƒ', ',', '.', NULL, NULL),
(6, 'Australia', 'Dollars', 'AUD', '$', ',', '.', NULL, NULL),
(7, 'Azerbaijan', 'New Manats', 'AZ', 'ман', ',', '.', NULL, NULL),
(8, 'Bahamas', 'Dollars', 'BSD', '$', ',', '.', NULL, NULL),
(9, 'Barbados', 'Dollars', 'BBD', '$', ',', '.', NULL, NULL),
(10, 'Belarus', 'Rubles', 'BYR', 'p.', ',', '.', NULL, NULL),
(11, 'Belgium', 'Euro', 'EUR', '€', ',', '.', NULL, NULL),
(12, 'Beliz', 'Dollars', 'BZD', 'BZ$', ',', '.', NULL, NULL),
(13, 'Bermuda', 'Dollars', 'BMD', '$', ',', '.', NULL, NULL),
(14, 'Bolivia', 'Bolivianos', 'BOB', '$b', ',', '.', NULL, NULL),
(15, 'Bosnia and Herzegovina', 'Convertible Marka', 'BAM', 'KM', ',', '.', NULL, NULL),
(16, 'Botswana', 'Pula\'s', 'BWP', 'P', ',', '.', NULL, NULL),
(17, 'Bulgaria', 'Leva', 'BG', 'лв', ',', '.', NULL, NULL),
(18, 'Brazil', 'Reais', 'BRL', 'R$', ',', '.', NULL, NULL),
(19, 'Britain [United Kingdom]', 'Pounds', 'GBP', '£', ',', '.', NULL, NULL),
(20, 'Brunei Darussalam', 'Dollars', 'BND', '$', ',', '.', NULL, NULL),
(21, 'Cambodia', 'Riels', 'KHR', '៛', ',', '.', NULL, NULL),
(22, 'Canada', 'Dollars', 'CAD', '$', ',', '.', NULL, NULL),
(23, 'Cayman Islands', 'Dollars', 'KYD', '$', ',', '.', NULL, NULL),
(24, 'Chile', 'Pesos', 'CLP', '$', ',', '.', NULL, NULL),
(25, 'China', 'Yuan Renminbi', 'CNY', '¥', ',', '.', NULL, NULL),
(26, 'Colombia', 'Pesos', 'COP', '$', ',', '.', NULL, NULL),
(27, 'Costa Rica', 'Colón', 'CRC', '₡', ',', '.', NULL, NULL),
(28, 'Croatia', 'Kuna', 'HRK', 'kn', ',', '.', NULL, NULL),
(29, 'Cuba', 'Pesos', 'CUP', '₱', ',', '.', NULL, NULL),
(30, 'Cyprus', 'Euro', 'EUR', '€', '.', ',', NULL, NULL),
(31, 'Czech Republic', 'Koruny', 'CZK', 'Kč', ',', '.', NULL, NULL),
(32, 'Denmark', 'Kroner', 'DKK', 'kr', ',', '.', NULL, NULL),
(33, 'Dominican Republic', 'Pesos', 'DOP ', 'RD$', ',', '.', NULL, NULL),
(34, 'East Caribbean', 'Dollars', 'XCD', '$', ',', '.', NULL, NULL),
(35, 'Egypt', 'Pounds', 'EGP', '£', ',', '.', NULL, NULL),
(36, 'El Salvador', 'Colones', 'SVC', '$', ',', '.', NULL, NULL),
(37, 'England [United Kingdom]', 'Pounds', 'GBP', '£', ',', '.', NULL, NULL),
(38, 'Euro', 'Euro', 'EUR', '€', '.', ',', NULL, NULL),
(39, 'Falkland Islands', 'Pounds', 'FKP', '£', ',', '.', NULL, NULL),
(40, 'Fiji', 'Dollars', 'FJD', '$', ',', '.', NULL, NULL),
(41, 'France', 'Euro', 'EUR', '€', '.', ',', NULL, NULL),
(42, 'Ghana', 'Cedis', 'GHS', '¢', ',', '.', NULL, NULL),
(43, 'Gibraltar', 'Pounds', 'GIP', '£', ',', '.', NULL, NULL),
(44, 'Greece', 'Euro', 'EUR', '€', '.', ',', NULL, NULL),
(45, 'Guatemala', 'Quetzales', 'GTQ', 'Q', ',', '.', NULL, NULL),
(46, 'Guernsey', 'Pounds', 'GGP', '£', ',', '.', NULL, NULL),
(47, 'Guyana', 'Dollars', 'GYD', '$', ',', '.', NULL, NULL),
(48, 'Holland [Netherlands]', 'Euro', 'EUR', '€', '.', ',', NULL, NULL),
(49, 'Honduras', 'Lempiras', 'HNL', 'L', ',', '.', NULL, NULL),
(50, 'Hong Kong', 'Dollars', 'HKD', '$', ',', '.', NULL, NULL),
(51, 'Hungary', 'Forint', 'HUF', 'Ft', ',', '.', NULL, NULL),
(52, 'Iceland', 'Kronur', 'ISK', 'kr', ',', '.', NULL, NULL),
(53, 'India', 'Rupees', 'INR', '₹', ',', '.', NULL, NULL),
(54, 'Indonesia', 'Rupiahs', 'IDR', 'Rp', ',', '.', NULL, NULL),
(55, 'Iran', 'Rials', 'IRR', '﷼', ',', '.', NULL, NULL),
(56, 'Ireland', 'Euro', 'EUR', '€', '.', ',', NULL, NULL),
(57, 'Isle of Man', 'Pounds', 'IMP', '£', ',', '.', NULL, NULL),
(58, 'Israel', 'New Shekels', 'ILS', '₪', ',', '.', NULL, NULL),
(59, 'Italy', 'Euro', 'EUR', '€', '.', ',', NULL, NULL),
(60, 'Jamaica', 'Dollars', 'JMD', 'J$', ',', '.', NULL, NULL),
(61, 'Japan', 'Yen', 'JPY', '¥', ',', '.', NULL, NULL),
(62, 'Jersey', 'Pounds', 'JEP', '£', ',', '.', NULL, NULL),
(63, 'Kazakhstan', 'Tenge', 'KZT', 'лв', ',', '.', NULL, NULL),
(64, 'Korea [North]', 'Won', 'KPW', '₩', ',', '.', NULL, NULL),
(65, 'Korea [South]', 'Won', 'KRW', '₩', ',', '.', NULL, NULL),
(66, 'Kyrgyzstan', 'Soms', 'KGS', 'лв', ',', '.', NULL, NULL),
(67, 'Laos', 'Kips', 'LAK', '₭', ',', '.', NULL, NULL),
(68, 'Latvia', 'Lati', 'LVL', 'Ls', ',', '.', NULL, NULL),
(69, 'Lebanon', 'Pounds', 'LBP', '£', ',', '.', NULL, NULL),
(70, 'Liberia', 'Dollars', 'LRD', '$', ',', '.', NULL, NULL),
(71, 'Liechtenstein', 'Switzerland Francs', 'CHF', 'CHF', ',', '.', NULL, NULL),
(72, 'Lithuania', 'Litai', 'LTL', 'Lt', ',', '.', NULL, NULL),
(73, 'Luxembourg', 'Euro', 'EUR', '€', '.', ',', NULL, NULL),
(74, 'Macedonia', 'Denars', 'MKD', 'ден', ',', '.', NULL, NULL),
(75, 'Malaysia', 'Ringgits', 'MYR', 'RM', ',', '.', NULL, NULL),
(76, 'Malta', 'Euro', 'EUR', '€', '.', ',', NULL, NULL),
(77, 'Mauritius', 'Rupees', 'MUR', '₨', ',', '.', NULL, NULL),
(78, 'Mexico', 'Pesos', 'MXN', '$', ',', '.', NULL, NULL),
(79, 'Mongolia', 'Tugriks', 'MNT', '₮', ',', '.', NULL, NULL),
(80, 'Mozambique', 'Meticais', 'MZ', 'MT', ',', '.', NULL, NULL),
(81, 'Namibia', 'Dollars', 'NAD', '$', ',', '.', NULL, NULL),
(82, 'Nepal', 'Rupees', 'NPR', '₨', ',', '.', NULL, NULL),
(83, 'Netherlands Antilles', 'Guilders', 'ANG', 'ƒ', ',', '.', NULL, NULL),
(84, 'Netherlands', 'Euro', 'EUR', '€', '.', ',', NULL, NULL),
(85, 'New Zealand', 'Dollars', 'NZD', '$', ',', '.', NULL, NULL),
(86, 'Nicaragua', 'Cordobas', 'NIO', 'C$', ',', '.', NULL, NULL),
(87, 'Nigeria', 'Nairas', 'NGN', '₦', ',', '.', NULL, NULL),
(88, 'North Korea', 'Won', 'KPW', '₩', ',', '.', NULL, NULL),
(89, 'Norway', 'Krone', 'NOK', 'kr', ',', '.', NULL, NULL),
(90, 'Oman', 'Rials', 'OMR', '﷼', ',', '.', NULL, NULL),
(91, 'Pakistan', 'Rupees', 'PKR', '₨', ',', '.', NULL, NULL),
(92, 'Panama', 'Balboa', 'PAB', 'B/.', ',', '.', NULL, NULL),
(93, 'Paraguay', 'Guarani', 'PYG', 'Gs', ',', '.', NULL, NULL),
(94, 'Peru', 'Nuevos Soles', 'PE', 'S/.', ',', '.', NULL, NULL),
(95, 'Philippines', 'Pesos', 'PHP', 'Php', ',', '.', NULL, NULL),
(96, 'Poland', 'Zlotych', 'PL', 'zł', ',', '.', NULL, NULL),
(97, 'Qatar', 'Rials', 'QAR', '﷼', ',', '.', NULL, NULL),
(98, 'Romania', 'New Lei', 'RO', 'lei', ',', '.', NULL, NULL),
(99, 'Russia', 'Rubles', 'RUB', 'руб', ',', '.', NULL, NULL),
(100, 'Saint Helena', 'Pounds', 'SHP', '£', ',', '.', NULL, NULL),
(101, 'Saudi Arabia', 'Riyals', 'SAR', '﷼', ',', '.', NULL, NULL),
(102, 'Serbia', 'Dinars', 'RSD', 'Дин.', ',', '.', NULL, NULL),
(103, 'Seychelles', 'Rupees', 'SCR', '₨', ',', '.', NULL, NULL),
(104, 'Singapore', 'Dollars', 'SGD', '$', ',', '.', NULL, NULL),
(105, 'Slovenia', 'Euro', 'EUR', '€', '.', ',', NULL, NULL),
(106, 'Solomon Islands', 'Dollars', 'SBD', '$', ',', '.', NULL, NULL),
(107, 'Somalia', 'Shillings', 'SOS', 'S', ',', '.', NULL, NULL),
(108, 'South Africa', 'Rand', 'ZAR', 'R', ',', '.', NULL, NULL),
(109, 'South Korea', 'Won', 'KRW', '₩', ',', '.', NULL, NULL),
(110, 'Spain', 'Euro', 'EUR', '€', '.', ',', NULL, NULL),
(111, 'Sri Lanka', 'Rupees', 'LKR', '₨', ',', '.', NULL, NULL),
(112, 'Sweden', 'Kronor', 'SEK', 'kr', ',', '.', NULL, NULL),
(113, 'Switzerland', 'Francs', 'CHF', 'CHF', ',', '.', NULL, NULL),
(114, 'Suriname', 'Dollars', 'SRD', '$', ',', '.', NULL, NULL),
(115, 'Syria', 'Pounds', 'SYP', '£', ',', '.', NULL, NULL),
(116, 'Taiwan', 'New Dollars', 'TWD', 'NT$', ',', '.', NULL, NULL),
(117, 'Thailand', 'Baht', 'THB', '฿', ',', '.', NULL, NULL),
(118, 'Trinidad and Tobago', 'Dollars', 'TTD', 'TT$', ',', '.', NULL, NULL),
(119, 'Turkey', 'Lira', 'TRY', 'TL', ',', '.', NULL, NULL),
(120, 'Turkey', 'Liras', 'TRL', '£', ',', '.', NULL, NULL),
(121, 'Tuvalu', 'Dollars', 'TVD', '$', ',', '.', NULL, NULL),
(122, 'Ukraine', 'Hryvnia', 'UAH', '₴', ',', '.', NULL, NULL),
(123, 'United Kingdom', 'Pounds', 'GBP', '£', ',', '.', NULL, NULL),
(124, 'United States of America', 'Dollars', 'USD', '$', ',', '.', NULL, NULL),
(125, 'Uruguay', 'Pesos', 'UYU', '$U', ',', '.', NULL, NULL),
(126, 'Uzbekistan', 'Sums', 'UZS', 'лв', ',', '.', NULL, NULL),
(127, 'Vatican City', 'Euro', 'EUR', '€', '.', ',', NULL, NULL),
(128, 'Venezuela', 'Bolivares Fuertes', 'VEF', 'Bs', ',', '.', NULL, NULL),
(129, 'Vietnam', 'Dong', 'VND', '₫', ',', '.', NULL, NULL),
(130, 'Yemen', 'Rials', 'YER', '﷼', ',', '.', NULL, NULL),
(131, 'Zimbabwe', 'Zimbabwe Dollars', 'ZWD', 'Z$', ',', '.', NULL, NULL),
(132, 'Iraq', 'Iraqi dinar', 'IQD', 'د.ع', ',', '.', NULL, NULL),
(133, 'Kenya', 'Kenyan shilling', 'KES', 'KSh', ',', '.', NULL, NULL),
(134, 'Bangladesh', 'Taka', 'BDT', '৳', ',', '.', NULL, NULL),
(135, 'Algerie', 'Algerian dinar', 'DZD', 'د.ج', ' ', '.', NULL, NULL),
(136, 'United Arab Emirates', 'United Arab Emirates dirham', 'AED', 'د.إ', ',', '.', NULL, NULL),
(137, 'Uganda', 'Uganda shillings', 'UGX', 'USh', ',', '.', NULL, NULL),
(138, 'Tanzania', 'Tanzanian shilling', 'TZS', 'TSh', ',', '.', NULL, NULL),
(139, 'Angola', 'Kwanza', 'AOA', 'Kz', ',', '.', NULL, NULL),
(140, 'Kuwait', 'Kuwaiti dinar', 'KWD', 'KD', ',', '.', NULL, NULL),
(141, 'Bahrain', 'Bahraini dinar', 'BHD', 'BD', ',', '.', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `customer_groups`
--

CREATE TABLE `customer_groups` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `amount` double(5,2) NOT NULL,
  `price_calculation_type` varchar(191) DEFAULT 'percentage',
  `selling_price_group_id` int(11) DEFAULT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dashboard_configurations`
--

CREATE TABLE `dashboard_configurations` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `created_by` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `color` varchar(191) NOT NULL,
  `configuration` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `discounts`
--

CREATE TABLE `discounts` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `business_id` int(11) NOT NULL,
  `brand_id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  `priority` int(11) DEFAULT NULL,
  `discount_type` varchar(191) DEFAULT NULL,
  `discount_amount` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `starts_at` datetime DEFAULT NULL,
  `ends_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `spg` varchar(100) DEFAULT NULL COMMENT 'Applicable in specified selling price group only. Use of applicable_in_spg column is discontinued',
  `applicable_in_cg` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `discount_variations`
--

CREATE TABLE `discount_variations` (
  `discount_id` int(11) NOT NULL,
  `variation_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `document_and_notes`
--

CREATE TABLE `document_and_notes` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(11) NOT NULL,
  `notable_id` int(11) NOT NULL,
  `notable_type` varchar(191) NOT NULL,
  `heading` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_private` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_allowances_and_deductions`
--

CREATE TABLE `essentials_allowances_and_deductions` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(11) NOT NULL,
  `description` varchar(191) NOT NULL,
  `type` enum('allowance','deduction') NOT NULL,
  `amount` decimal(22,4) NOT NULL,
  `amount_type` enum('fixed','percent') NOT NULL,
  `applicable_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_attendances`
--

CREATE TABLE `essentials_attendances` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `clock_in_time` datetime DEFAULT NULL,
  `clock_out_time` datetime DEFAULT NULL,
  `essentials_shift_id` int(11) DEFAULT NULL,
  `ip_address` varchar(191) DEFAULT NULL,
  `clock_in_note` text DEFAULT NULL,
  `clock_out_note` text DEFAULT NULL,
  `clock_in_location` text DEFAULT NULL,
  `clock_out_location` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_documents`
--

CREATE TABLE `essentials_documents` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(191) DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_document_shares`
--

CREATE TABLE `essentials_document_shares` (
  `id` int(10) UNSIGNED NOT NULL,
  `document_id` int(11) NOT NULL,
  `value_type` enum('user','role') NOT NULL,
  `value` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_holidays`
--

CREATE TABLE `essentials_holidays` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `business_id` int(11) NOT NULL,
  `location_id` int(11) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_kb`
--

CREATE TABLE `essentials_kb` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `business_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(191) NOT NULL,
  `content` longtext DEFAULT NULL,
  `status` varchar(191) NOT NULL,
  `kb_type` varchar(191) NOT NULL,
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'id from essentials_kb table',
  `share_with` varchar(191) DEFAULT NULL COMMENT 'public, private, only_with',
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_kb_users`
--

CREATE TABLE `essentials_kb_users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `kb_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_leaves`
--

CREATE TABLE `essentials_leaves` (
  `id` int(10) UNSIGNED NOT NULL,
  `essentials_leave_type_id` int(11) DEFAULT NULL,
  `business_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `ref_no` varchar(191) DEFAULT NULL,
  `status` enum('pending','approved','cancelled') DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `status_note` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_leave_types`
--

CREATE TABLE `essentials_leave_types` (
  `id` int(10) UNSIGNED NOT NULL,
  `leave_type` varchar(191) NOT NULL,
  `max_leave_count` int(11) DEFAULT NULL,
  `leave_count_interval` enum('month','year') DEFAULT NULL,
  `business_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_messages`
--

CREATE TABLE `essentials_messages` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `location_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_payroll_groups`
--

CREATE TABLE `essentials_payroll_groups` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `business_id` int(11) NOT NULL,
  `location_id` int(11) DEFAULT NULL COMMENT 'payroll for work location',
  `name` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL,
  `payment_status` varchar(191) NOT NULL DEFAULT 'due',
  `gross_total` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_payroll_group_transactions`
--

CREATE TABLE `essentials_payroll_group_transactions` (
  `payroll_group_id` bigint(20) UNSIGNED NOT NULL,
  `transaction_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_reminders`
--

CREATE TABLE `essentials_reminders` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `end_time` time DEFAULT NULL,
  `repeat` enum('one_time','every_day','every_week','every_month') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_shifts`
--

CREATE TABLE `essentials_shifts` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `type` enum('fixed_shift','flexible_shift') NOT NULL DEFAULT 'fixed_shift',
  `business_id` int(11) NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `is_allowed_auto_clockout` tinyint(1) NOT NULL DEFAULT 0,
  `auto_clockout_time` time DEFAULT NULL,
  `holidays` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_todos_users`
--

CREATE TABLE `essentials_todos_users` (
  `todo_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_todo_comments`
--

CREATE TABLE `essentials_todo_comments` (
  `id` int(10) UNSIGNED NOT NULL,
  `comment` text NOT NULL,
  `task_id` int(11) NOT NULL,
  `comment_by` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_to_dos`
--

CREATE TABLE `essentials_to_dos` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(11) NOT NULL,
  `task` text NOT NULL,
  `date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `task_id` varchar(191) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(191) DEFAULT NULL,
  `estimated_hours` varchar(191) DEFAULT NULL,
  `priority` varchar(191) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_user_allowance_and_deductions`
--

CREATE TABLE `essentials_user_allowance_and_deductions` (
  `user_id` int(11) NOT NULL,
  `allowance_deduction_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_user_sales_targets`
--

CREATE TABLE `essentials_user_sales_targets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `target_start` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `target_end` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `commission_percent` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `essentials_user_shifts`
--

CREATE TABLE `essentials_user_shifts` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `essentials_shift_id` int(11) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `expense_categories`
--

CREATE TABLE `expense_categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `code` varchar(191) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `group_sub_taxes`
--

CREATE TABLE `group_sub_taxes` (
  `group_tax_id` int(10) UNSIGNED NOT NULL,
  `tax_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `invoice_layouts`
--

CREATE TABLE `invoice_layouts` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `header_text` text DEFAULT NULL,
  `invoice_no_prefix` varchar(191) DEFAULT NULL,
  `quotation_no_prefix` varchar(191) DEFAULT NULL,
  `invoice_heading` varchar(191) DEFAULT NULL,
  `sub_heading_line1` varchar(191) DEFAULT NULL,
  `sub_heading_line2` varchar(191) DEFAULT NULL,
  `sub_heading_line3` varchar(191) DEFAULT NULL,
  `sub_heading_line4` varchar(191) DEFAULT NULL,
  `sub_heading_line5` varchar(191) DEFAULT NULL,
  `invoice_heading_not_paid` varchar(191) DEFAULT NULL,
  `invoice_heading_paid` varchar(191) DEFAULT NULL,
  `quotation_heading` varchar(191) DEFAULT NULL,
  `sub_total_label` varchar(191) DEFAULT NULL,
  `discount_label` varchar(191) DEFAULT NULL,
  `tax_label` varchar(191) DEFAULT NULL,
  `total_label` varchar(191) DEFAULT NULL,
  `round_off_label` varchar(191) DEFAULT NULL,
  `total_due_label` varchar(191) DEFAULT NULL,
  `paid_label` varchar(191) DEFAULT NULL,
  `show_client_id` tinyint(1) NOT NULL DEFAULT 0,
  `client_id_label` varchar(191) DEFAULT NULL,
  `client_tax_label` varchar(191) DEFAULT NULL,
  `date_label` varchar(191) DEFAULT NULL,
  `date_time_format` varchar(191) DEFAULT NULL,
  `show_time` tinyint(1) NOT NULL DEFAULT 1,
  `show_brand` tinyint(1) NOT NULL DEFAULT 0,
  `show_sku` tinyint(1) NOT NULL DEFAULT 1,
  `show_cat_code` tinyint(1) NOT NULL DEFAULT 1,
  `show_expiry` tinyint(1) NOT NULL DEFAULT 0,
  `show_lot` tinyint(1) NOT NULL DEFAULT 0,
  `show_image` tinyint(1) NOT NULL DEFAULT 0,
  `show_sale_description` tinyint(1) NOT NULL DEFAULT 0,
  `sales_person_label` varchar(191) DEFAULT NULL,
  `show_sales_person` tinyint(1) NOT NULL DEFAULT 0,
  `table_product_label` varchar(191) DEFAULT NULL,
  `table_qty_label` varchar(191) DEFAULT NULL,
  `table_unit_price_label` varchar(191) DEFAULT NULL,
  `table_subtotal_label` varchar(191) DEFAULT NULL,
  `cat_code_label` varchar(191) DEFAULT NULL,
  `logo` varchar(191) DEFAULT NULL,
  `show_logo` tinyint(1) NOT NULL DEFAULT 0,
  `show_business_name` tinyint(1) NOT NULL DEFAULT 0,
  `show_location_name` tinyint(1) NOT NULL DEFAULT 1,
  `show_landmark` tinyint(1) NOT NULL DEFAULT 1,
  `show_city` tinyint(1) NOT NULL DEFAULT 1,
  `show_state` tinyint(1) NOT NULL DEFAULT 1,
  `show_zip_code` tinyint(1) NOT NULL DEFAULT 1,
  `show_country` tinyint(1) NOT NULL DEFAULT 1,
  `show_mobile_number` tinyint(1) NOT NULL DEFAULT 1,
  `show_alternate_number` tinyint(1) NOT NULL DEFAULT 0,
  `show_email` tinyint(1) NOT NULL DEFAULT 0,
  `show_tax_1` tinyint(1) NOT NULL DEFAULT 1,
  `show_tax_2` tinyint(1) NOT NULL DEFAULT 0,
  `show_barcode` tinyint(1) NOT NULL DEFAULT 0,
  `show_payments` tinyint(1) NOT NULL DEFAULT 0,
  `show_customer` tinyint(1) NOT NULL DEFAULT 0,
  `customer_label` varchar(191) DEFAULT NULL,
  `commission_agent_label` varchar(191) DEFAULT NULL,
  `show_commission_agent` tinyint(1) NOT NULL DEFAULT 0,
  `show_reward_point` tinyint(1) NOT NULL DEFAULT 0,
  `highlight_color` varchar(10) DEFAULT NULL,
  `footer_text` text DEFAULT NULL,
  `module_info` text DEFAULT NULL,
  `common_settings` text DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `business_id` int(10) UNSIGNED NOT NULL,
  `show_letter_head` tinyint(1) NOT NULL DEFAULT 0,
  `letter_head` varchar(191) DEFAULT NULL,
  `show_qr_code` tinyint(1) NOT NULL DEFAULT 0,
  `qr_code_fields` text DEFAULT NULL,
  `design` varchar(190) DEFAULT 'classic',
  `cn_heading` varchar(191) DEFAULT NULL COMMENT 'cn = credit note',
  `cn_no_label` varchar(191) DEFAULT NULL,
  `cn_amount_label` varchar(191) DEFAULT NULL,
  `table_tax_headings` text DEFAULT NULL,
  `show_previous_bal` tinyint(1) NOT NULL DEFAULT 0,
  `prev_bal_label` varchar(191) DEFAULT NULL,
  `show_previous_balance_due` tinyint(1) NOT NULL DEFAULT 0,
  `previous_balance_due_label` varchar(191) DEFAULT NULL,
  `change_return_label` varchar(191) DEFAULT NULL,
  `product_custom_fields` text DEFAULT NULL,
  `contact_custom_fields` text DEFAULT NULL,
  `location_custom_fields` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `invoice_layouts`
--

INSERT INTO `invoice_layouts` (`id`, `name`, `header_text`, `invoice_no_prefix`, `quotation_no_prefix`, `invoice_heading`, `sub_heading_line1`, `sub_heading_line2`, `sub_heading_line3`, `sub_heading_line4`, `sub_heading_line5`, `invoice_heading_not_paid`, `invoice_heading_paid`, `quotation_heading`, `sub_total_label`, `discount_label`, `tax_label`, `total_label`, `round_off_label`, `total_due_label`, `paid_label`, `show_client_id`, `client_id_label`, `client_tax_label`, `date_label`, `date_time_format`, `show_time`, `show_brand`, `show_sku`, `show_cat_code`, `show_expiry`, `show_lot`, `show_image`, `show_sale_description`, `sales_person_label`, `show_sales_person`, `table_product_label`, `table_qty_label`, `table_unit_price_label`, `table_subtotal_label`, `cat_code_label`, `logo`, `show_logo`, `show_business_name`, `show_location_name`, `show_landmark`, `show_city`, `show_state`, `show_zip_code`, `show_country`, `show_mobile_number`, `show_alternate_number`, `show_email`, `show_tax_1`, `show_tax_2`, `show_barcode`, `show_payments`, `show_customer`, `customer_label`, `commission_agent_label`, `show_commission_agent`, `show_reward_point`, `highlight_color`, `footer_text`, `module_info`, `common_settings`, `is_default`, `business_id`, `show_letter_head`, `letter_head`, `show_qr_code`, `qr_code_fields`, `design`, `cn_heading`, `cn_no_label`, `cn_amount_label`, `table_tax_headings`, `show_previous_bal`, `prev_bal_label`, `show_previous_balance_due`, `previous_balance_due_label`, `change_return_label`, `product_custom_fields`, `contact_custom_fields`, `location_custom_fields`, `created_at`, `updated_at`) VALUES
(1, 'Default', NULL, 'Invoice No.', NULL, 'Invoice', NULL, NULL, NULL, NULL, NULL, '', '', NULL, 'Subtotal', 'Discount', 'Tax', 'Total', NULL, 'Total Due', 'Total Paid', 0, NULL, NULL, 'Date', NULL, 1, 0, 1, 1, 0, 0, 0, 0, NULL, 0, 'Product', 'Quantity', 'Unit Price', 'Subtotal', NULL, NULL, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 'Customer', NULL, 0, 0, '#000000', '', NULL, NULL, 1, 1, 0, NULL, 0, NULL, 'classic', NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2025-10-29 02:51:02', '2025-10-29 02:51:02');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `invoice_schemes`
--

CREATE TABLE `invoice_schemes` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `scheme_type` enum('blank','year') NOT NULL,
  `number_type` varchar(100) NOT NULL DEFAULT 'sequential',
  `prefix` varchar(191) DEFAULT NULL,
  `start_number` int(11) DEFAULT NULL,
  `invoice_count` int(11) NOT NULL DEFAULT 0,
  `total_digits` int(11) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `invoice_schemes`
--

INSERT INTO `invoice_schemes` (`id`, `business_id`, `name`, `scheme_type`, `number_type`, `prefix`, `start_number`, `invoice_count`, `total_digits`, `is_default`, `created_at`, `updated_at`) VALUES
(1, 1, 'Default', 'blank', 'sequential', '', 1, 17, 4, 1, '2025-10-29 02:51:01', '2026-01-03 16:22:05');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `media`
--

CREATE TABLE `media` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(11) NOT NULL,
  `file_name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `model_type` varchar(191) NOT NULL,
  `woocommerce_media_id` int(11) DEFAULT NULL,
  `model_media_type` varchar(191) DEFAULT NULL,
  `model_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `media`
--

INSERT INTO `media` (`id`, `business_id`, `file_name`, `description`, `uploaded_by`, `model_type`, `woocommerce_media_id`, `model_media_type`, `model_id`, `created_at`, `updated_at`) VALUES
(1, 1, '1761704765_359114197_Captura de pantalla 2025-10-28 220333.png', NULL, 1, 'App\\Product', NULL, NULL, 3, '2025-10-28 23:26:05', '2025-12-27 22:32:30'),
(2, 1, '1763245416_180600340_lV7Q7v4y-IFNjHjcGjWmh.png', NULL, 1, 'App\\Variation', 141, NULL, 12, '2025-11-15 19:23:36', '2025-12-27 22:41:51'),
(3, 1, '1763245416_820209555_lV7Q7v4y-IFNjHjcGjWmh.png', NULL, 1, 'App\\Variation', 143, NULL, 13, '2025-11-15 19:23:36', '2025-12-27 22:41:51'),
(4, 1, '1763245569_1497610721_56yB9YZ9rB5JEBnEuQPDK.png', NULL, 1, 'App\\Variation', 145, NULL, 14, '2025-11-15 19:26:09', '2025-12-27 22:41:58'),
(5, 1, '1763245720_1919338021_1757013795483-54196.png', NULL, 1, 'App\\Variation', 147, NULL, 15, '2025-11-15 19:28:40', '2025-12-27 22:42:22'),
(6, 1, '1763245720_1247743859_IS6jdWtrHvfcMnD4A9wmn.png', NULL, 1, 'App\\Variation', 149, NULL, 16, '2025-11-15 19:28:40', '2025-12-27 22:42:22'),
(7, 1, '1763245796_913865081_1757013795483-54196.png', NULL, 1, 'App\\Variation', 151, NULL, 17, '2025-11-15 19:29:56', '2025-12-27 22:42:22'),
(8, 1, '1763245879_1055775223_l4oJhXUrTNqHwEKYs_4yK.png', NULL, 1, 'App\\Variation', NULL, NULL, 18, '2025-11-15 19:31:19', '2025-12-27 22:32:30'),
(9, 1, '1763245997_1587598697_zXPVpH6vDJqRNQphrC1uV.png', NULL, 1, 'App\\Variation', NULL, NULL, 19, '2025-11-15 19:33:17', '2025-12-27 22:32:30'),
(10, 1, '1763246200_1738342104_1759172502870-84127.png', NULL, 1, 'App\\Variation', 153, NULL, 20, '2025-11-15 19:36:40', '2025-12-27 22:43:03'),
(11, 1, '1763246200_290123907_1759172502870-2460.png', NULL, 1, 'App\\Variation', 155, NULL, 21, '2025-11-15 19:36:40', '2025-12-27 22:43:03'),
(12, 1, '1763246200_1688419740_1759172502870-8501.png', NULL, 1, 'App\\Variation', 157, NULL, 22, '2025-11-15 19:36:40', '2025-12-27 22:43:03'),
(13, 1, '1763246200_1865544490_1759172502870-89757.png', NULL, 1, 'App\\Variation', 159, NULL, 23, '2025-11-15 19:36:40', '2025-12-27 22:43:03'),
(14, 1, '1763246302_834505540_1761837633192-19815.png', NULL, 1, 'App\\Variation', 161, NULL, 24, '2025-11-15 19:38:22', '2025-12-27 22:43:11'),
(15, 1, '1763246435_1848058386_Ek27cf2YCczC7YYJKBR26.png', NULL, 1, 'App\\Variation', 163, NULL, 25, '2025-11-15 19:40:35', '2025-12-27 22:43:49'),
(16, 1, '1763246435_1529130233_6rRps_8tz2IuFWkQNV6Fy.png', NULL, 1, 'App\\Variation', 165, NULL, 26, '2025-11-15 19:40:35', '2025-12-27 22:43:49'),
(17, 1, '1763246435_1008095101_cKsy-0QjjmdUSPGbClUL_.png', NULL, 1, 'App\\Variation', 167, NULL, 27, '2025-11-15 19:40:35', '2025-12-27 22:43:49'),
(18, 1, '1763247089_1188148892_1761839069107-51556.png', NULL, 1, 'App\\Variation', NULL, NULL, 28, '2025-11-15 19:51:29', '2025-12-27 22:32:30'),
(19, 1, '1763247089_2118793719_1761839069107-29994.png', NULL, 1, 'App\\Variation', NULL, NULL, 29, '2025-11-15 19:51:29', '2025-12-27 22:32:30'),
(20, 1, '1763247089_575579691_1761839069107-83794.png', NULL, 1, 'App\\Variation', NULL, NULL, 30, '2025-11-15 19:51:29', '2025-12-27 22:32:30'),
(21, 1, '1763247739_1572026935_1761839195970-69229.png', NULL, 1, 'App\\Variation', 169, NULL, 31, '2025-11-15 20:02:19', '2025-12-27 22:44:03'),
(22, 1, '1763247739_1269800128_1761839195970-69229.png', NULL, 1, 'App\\Variation', 171, NULL, 32, '2025-11-15 20:02:19', '2025-12-27 22:44:03'),
(23, 1, '1763247795_1695729704_1743076395658-69406.png', NULL, 1, 'App\\Variation', NULL, NULL, 33, '2025-11-15 20:03:15', '2025-12-27 22:32:30'),
(24, 1, '1763248702_1707102085_vCWQt_E9v-XZfuLoZ-VN7.png', NULL, 1, 'App\\Variation', NULL, NULL, 34, '2025-11-15 20:18:22', '2025-12-27 22:32:30'),
(25, 1, '1763249049_1141562339_1758568668625-83638.png', NULL, 1, 'App\\Variation', NULL, NULL, 35, '2025-11-15 20:24:09', '2025-12-27 22:32:30'),
(26, 1, '1763249264_1829816767_1758568712116-6217.png', NULL, 1, 'App\\Variation', NULL, NULL, 36, '2025-11-15 20:27:44', '2025-12-27 22:32:30'),
(27, 1, '1763249468_1461103579_tp8R06b99vb1k8P78zCal.png', NULL, 1, 'App\\Variation', 173, NULL, 37, '2025-11-15 20:31:08', '2025-12-27 22:44:25'),
(28, 1, '1763249468_1873588308_1758568712116-24640.png', NULL, 1, 'App\\Variation', 175, NULL, 38, '2025-11-15 20:31:08', '2025-12-27 22:44:25'),
(29, 1, '1763249859_1142981916_JokRJroD8PldpnLAYd-L2.png', NULL, 1, 'App\\Variation', NULL, NULL, 41, '2025-11-15 20:37:39', '2025-12-27 22:32:30'),
(30, 1, '1763253162_1095428076_oefFDUXl8yoRr7fi8NRcC.png', NULL, 1, 'App\\Variation', 179, NULL, 42, '2025-11-15 21:32:42', '2025-12-27 22:44:43'),
(31, 1, '1763253162_319540321_oefFDUXl8yoRr7fi8NRcC.png', NULL, 1, 'App\\Variation', 181, NULL, 43, '2025-11-15 21:32:42', '2025-12-27 22:44:43'),
(32, 1, '1763254467_1315316116_1761664976309-30843.png', NULL, 1, 'App\\Variation', 183, NULL, 44, '2025-11-15 21:54:27', '2025-12-27 22:45:25'),
(33, 1, '1763254467_153156411_1761664976309-3026.png', NULL, 1, 'App\\Variation', 185, NULL, 45, '2025-11-15 21:54:27', '2025-12-27 22:45:25'),
(34, 1, '1763254467_1635520031_1761664976309-88443.png', NULL, 1, 'App\\Variation', 187, NULL, 46, '2025-11-15 21:54:27', '2025-12-27 22:45:25'),
(35, 1, '1763254467_1649473766_1761664976309-42315.png', NULL, 1, 'App\\Variation', 189, NULL, 47, '2025-11-15 21:54:27', '2025-12-27 22:45:25'),
(36, 1, '1763254467_248131892_1761664976309-79262.png', NULL, 1, 'App\\Variation', 191, NULL, 48, '2025-11-15 21:54:27', '2025-12-27 22:45:25'),
(37, 1, '1763255439_1805765041_wmXbtKGjuBDYqiBWhgVYb.png', NULL, 1, 'App\\Variation', 204, NULL, 60, '2025-11-15 22:10:39', '2025-12-27 22:46:10'),
(38, 1, '1763255439_366629769_L-EhMtjm4iKXvlFTWd4UD.png', NULL, 1, 'App\\Variation', 206, NULL, 61, '2025-11-15 22:10:39', '2025-12-27 22:46:10'),
(39, 1, '1763255439_263335379_fSUMCbVKCOsgpPhuw6ZEL.png', NULL, 1, 'App\\Variation', 208, NULL, 62, '2025-11-15 22:10:39', '2025-12-27 22:46:10'),
(40, 1, '1763255439_1246735273_vpVkGe7jm-n6ie_IKVHH4.png', NULL, 1, 'App\\Variation', 210, NULL, 63, '2025-11-15 22:10:39', '2025-12-27 22:46:10'),
(41, 1, '1763257142_150773957_lushka-man-90-a9a274a2a8cd5caa7d17550145694084-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 68, '2025-11-15 22:39:02', '2025-12-27 22:32:30'),
(42, 1, '1763257254_172827368_lushka-man-107-d304c2434684ab66d217593234644437-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 71, '2025-11-15 22:40:54', '2025-12-27 22:32:30'),
(43, 1, '1763257254_1652534172_vintage-2-0e30a4a3fa643cba1917567313684244-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 72, '2025-11-15 22:40:54', '2025-12-27 22:32:30'),
(44, 1, '1763999106_1398662778__mg_4011_copia_1.webp', NULL, 1, 'App\\Variation', NULL, NULL, 80, '2025-11-24 12:45:06', '2025-12-27 22:32:30'),
(45, 1, '1763999106_1876087745__mg_4014_copia_1_1.webp', NULL, 1, 'App\\Variation', NULL, NULL, 81, '2025-11-24 12:45:06', '2025-12-27 22:32:30'),
(46, 1, '1763999106_1927983970__mg_4008_copia_1.webp', NULL, 1, 'App\\Variation', NULL, NULL, 82, '2025-11-24 12:45:06', '2025-12-27 22:32:30'),
(47, 1, '1763999334_669003526__mg_3980_copia_2.webp', NULL, 1, 'App\\Variation', NULL, NULL, 83, '2025-11-24 12:48:54', '2025-12-27 22:32:30'),
(48, 1, '1763999490_1737748656__mg_3943_copia_1.webp', NULL, 1, 'App\\Variation', NULL, NULL, 84, '2025-11-24 12:51:30', '2025-12-27 22:32:30'),
(49, 1, '1763999490_1190619420__mg_3944_copia_1.webp', NULL, 1, 'App\\Variation', NULL, NULL, 85, '2025-11-24 12:51:30', '2025-12-27 22:32:30'),
(50, 1, '1763999997_521789777__mg_2552_copia_1.webp', NULL, 1, 'App\\Variation', NULL, NULL, 87, '2025-11-24 12:59:57', '2025-12-27 22:32:30'),
(51, 1, '1764000374_824657074__dsc9444_copia_2.webp', NULL, 1, 'App\\Variation', NULL, NULL, 88, '2025-11-24 13:06:14', '2025-12-27 22:32:30'),
(52, 1, '1764000374_2138404352__dsc8917_2.webp', NULL, 1, 'App\\Variation', NULL, NULL, 89, '2025-11-24 13:06:14', '2025-12-27 22:32:30'),
(53, 1, '1764000468_1242635189__dsc8878_copia_1.webp', NULL, 1, 'App\\Variation', NULL, NULL, 90, '2025-11-24 13:07:48', '2025-12-27 22:32:30'),
(54, 1, '1764000558_846458605__dsc7652_copia_1.webp', NULL, 1, 'App\\Variation', NULL, NULL, 91, '2025-11-24 13:09:18', '2025-12-27 22:32:30'),
(55, 1, '1764000665_1892299343__dsc7874_copia-photoroom_1.webp', NULL, 1, 'App\\Variation', NULL, NULL, 92, '2025-11-24 13:11:05', '2025-12-27 22:32:30'),
(56, 1, '1764000767_1459203418__dsc7434_copia_1.webp', NULL, 1, 'App\\Variation', NULL, NULL, 93, '2025-11-24 13:12:47', '2025-12-27 22:32:30'),
(57, 1, '1764000924_1515142043_iy-0-0005_plateado_1.webp', NULL, 1, 'App\\Variation', NULL, NULL, 94, '2025-11-24 13:15:24', '2025-12-27 22:32:30'),
(58, 1, '1764000924_1769830695_iy-0-0005_dorado_1.webp', NULL, 1, 'App\\Variation', NULL, NULL, 95, '2025-11-24 13:15:24', '2025-12-27 22:32:30'),
(59, 1, '1764002476_943486171__mg_3921_copia_1.webp', NULL, 1, 'App\\Variation', 865, NULL, 96, '2025-11-24 13:41:16', '2026-01-03 18:56:19'),
(60, 1, '1764002476_34522411__mg_3922_copia_1.webp', NULL, 1, 'App\\Variation', 865, NULL, 97, '2025-11-24 13:41:16', '2026-01-03 18:56:19'),
(61, 1, '1764003269_203127105_whatsapp-image-2025-11-15-at-11-12-52-am-1-36af533fbe1c1f295717635534968989-640-0.webp', NULL, 1, 'App\\Variation', NULL, NULL, 98, '2025-11-24 13:54:29', '2025-12-27 22:32:30'),
(62, 1, '1764003389_463498286_whatsapp-image-2025-11-18-at-12-55-09-pm-12082df9517b423ed717634940199462-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 99, '2025-11-24 13:56:29', '2025-12-27 22:32:30'),
(63, 1, '1764003590_1005180997_whatsapp-image-2025-11-14-at-10-04-11-am-84a761e150720bd4eb17631258384604-480-0.webp', NULL, 1, 'App\\Variation', NULL, NULL, 100, '2025-11-24 13:59:50', '2025-12-27 22:32:30'),
(64, 1, '1764003684_775745949_whatsapp-image-2025-10-03-at-10-33-17-am-72696f83356c60a24a17595056221068-480-0.webp', NULL, 1, 'App\\Variation', NULL, NULL, 101, '2025-11-24 14:01:24', '2025-12-27 22:32:30'),
(65, 1, '1764003883_716891682_whatsapp-image-2025-10-03-at-8-39-26-am-c5f73fbdbc5333411a17595044371096-640-0.webp', NULL, 1, 'App\\Variation', NULL, NULL, 102, '2025-11-24 14:04:43', '2025-12-27 22:32:30'),
(66, 1, '1764003883_940445861_whatsapp-image-2025-11-03-at-3-34-58-pm-1-c9ce2a54744df779b717621958217419-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 103, '2025-11-24 14:04:43', '2025-12-27 22:32:30'),
(67, 1, '1764003883_815443102_whatsapp-image-2025-11-03-at-3-34-58-pm-83fd8e914e8c6a8ea517621958217338-640-0.webp', NULL, 1, 'App\\Variation', NULL, NULL, 104, '2025-11-24 14:04:43', '2025-12-27 22:32:30'),
(68, 1, '1764005094_1411117843_whatsapp-image-2025-10-16-at-3-15-28-pm-6d5d91b53be069672417606402451998-480-0.webp', NULL, 1, 'App\\Variation', NULL, NULL, 109, '2025-11-24 14:24:54', '2025-12-27 22:32:30'),
(69, 1, '1764005094_79817016_whatsapp-image-2025-09-06-at-10-56-21-am-9d5e76d96230fbd8a117571712669751-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 110, '2025-11-24 14:24:54', '2025-12-27 22:32:30'),
(70, 1, '1764007763_1486563754_whatsapp-image-2025-11-20-at-4-16-16-pm-2-copia-c8e6f3ebed9be6093317637247195696-640-0.webp', NULL, 1, 'App\\Variation', NULL, NULL, 114, '2025-11-24 15:09:23', '2025-12-27 22:32:30'),
(71, 1, '1764007763_1230611350_whatsapp-image-2025-11-20-at-4-16-16-pm-copia-f074d69d0c70e2e1c417637247194104-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 115, '2025-11-24 15:09:23', '2025-12-27 22:32:30'),
(72, 1, '1764010002_1198885746__mg_8431-51f5d7a0852915df2517147353278918-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 117, '2025-11-24 15:46:42', '2025-12-27 22:32:30'),
(73, 1, '1764010162_1114223808_image00005-ce352fc60e539cc99117628750518046-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 118, '2025-11-24 15:49:22', '2025-12-27 22:32:30'),
(74, 1, '1764010334_879377683_image00001-2-05cb8becef0381bed317629515816882-1024-1024.webp', NULL, 1, 'App\\Variation', 37147, NULL, 119, '2025-11-24 15:52:14', '2026-01-03 18:56:21'),
(75, 1, '1764010334_1315281622_image00001-2-05cb8becef0381bed317629515816882-1024-1024.webp', NULL, 1, 'App\\Variation', 37147, NULL, 120, '2025-11-24 15:52:14', '2026-01-03 18:56:21'),
(76, 1, '1764010334_1450563519_image00001-2-05cb8becef0381bed317629515816882-1024-1024.webp', NULL, 1, 'App\\Variation', 37147, NULL, 121, '2025-11-24 15:52:14', '2026-01-03 18:56:21'),
(77, 1, '1764010566_1363047002_img_0623_jpg-e6d885f1f45f2aab8017285684497400-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 122, '2025-11-24 15:56:06', '2025-12-27 22:32:30'),
(78, 1, '1764010566_1247555411_img_0623_jpg-e6d885f1f45f2aab8017285684497400-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 123, '2025-11-24 15:56:06', '2025-12-27 22:32:30'),
(79, 1, '1764010763_584325663_20241017_111331-df1220c89b7689444117293381575602-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 124, '2025-11-24 15:59:23', '2025-12-27 22:32:30'),
(80, 1, '1764011004_78454687_image00004-3-29fc3aa78003690d3c17587224611278-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 125, '2025-11-24 16:03:24', '2025-12-27 22:32:30'),
(81, 1, '1764011004_988313172_image00002-3-1fe1814c4263b6963e17587224615658-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 126, '2025-11-24 16:03:24', '2025-12-27 22:32:30'),
(82, 1, '1764011004_763792205_image00003-3-cd6bfd41ebbd7c878b17587224617273-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 127, '2025-11-24 16:03:24', '2025-12-27 22:32:30'),
(83, 1, '1764012099_2094675932_img-20250820-wa0009-07729555c0ad2e1cf917556995950147-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 132, '2025-11-24 16:21:39', '2025-12-27 22:32:30'),
(84, 1, '1764012099_588193169_img-20250820-wa0006-4e1b8e86fc27642eb617556995948038-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 133, '2025-11-24 16:21:39', '2025-12-27 22:32:30'),
(85, 1, '1764012360_2113234692_1007369070-76239fad234df64edb17631332028473-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 134, '2025-11-24 16:26:00', '2025-12-27 22:32:30'),
(86, 1, '1764012553_773673625_1007416843-455fc020aa630db0c217637475565470-1024-1024.webp', NULL, 1, 'App\\Variation', 916, NULL, 135, '2025-11-24 16:29:13', '2026-01-03 18:56:23'),
(87, 1, '1764028979_1313261482_whatsapp-image-2025-07-07-at-11-26-28-79a5fef137223c4b6417519000521950-1024-1024.webp', NULL, 1, 'App\\Variation', 37031, NULL, 225, '2025-11-24 21:02:59', '2026-01-03 18:56:29'),
(88, 1, '1764028979_2070005878_whatsapp-image-2025-07-07-at-11-26-29-1-69e7f8e61cd4db77db17519000525050-1024-1024.webp', NULL, 1, 'App\\Variation', 37031, NULL, 226, '2025-11-24 21:02:59', '2026-01-03 18:56:29'),
(89, 1, '1764120522_408859587_whatsapp-image-2025-09-11-at-14-56-06-2-c2695c8189db3e93ec17576176380459-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 244, '2025-11-25 22:28:42', '2025-12-27 22:32:30'),
(90, 1, '1764120522_235095441_whatsapp-image-2025-09-11-at-14-56-07-14a6c07157368776b417576176382235-1024-1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 245, '2025-11-25 22:28:42', '2025-12-27 22:32:30'),
(91, 1, '1764198594_1159240988_0ad62719-0050-4126-b66e-7a9284f3c80e---1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 254, '2025-11-26 20:09:54', '2025-12-27 22:32:30'),
(92, 1, '1764198594_1890466459_815fae71-1067-4577-820c-9fdf1db0d463---1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 255, '2025-11-26 20:09:54', '2025-12-27 22:32:30'),
(93, 1, '1764198594_1286208719_3a875094-0ded-4d41-a511-feba51977d95---1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 256, '2025-11-26 20:09:54', '2025-12-27 22:32:30'),
(94, 1, '1764198840_796174936_09bd774e-522c-4cef-938f-56d73524c77a---1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 257, '2025-11-26 20:14:00', '2025-12-27 22:32:30'),
(95, 1, '1764198840_16490069_2bc4d3e8-30d9-4f82-b3b7-a0e9c7901156---1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 258, '2025-11-26 20:14:00', '2025-12-27 22:32:30'),
(96, 1, '1764199215_2112891363_image_c3ee12fb-ab76-4572-a006-0d1cb66625d5---1024.webp', NULL, 1, 'App\\Variation', NULL, NULL, 260, '2025-11-26 20:20:15', '2025-12-27 22:32:30'),
(97, 1, '1764202945_2030792605_lushka_-13-adfdd3eed6fcc6cb9a17615811726135-1024-1024.webp', NULL, 1, 'App\\Variation', 37154, NULL, 274, '2025-11-26 21:22:25', '2026-01-03 18:56:34'),
(98, 1, '1764528086_906504438_lushka-mujer-baja-228-b63a979bcccda0511717569991259952-1024-1024.jpg', NULL, 1, 'App\\Variation', 518, NULL, 282, '2025-11-30 15:41:26', '2025-12-27 22:49:14'),
(99, 1, '1764537768_1382489083_short-allende-conjunto (2).jpg', NULL, 1, 'App\\Variation', NULL, NULL, 340, '2025-11-30 18:22:48', '2025-12-27 22:32:30'),
(100, 1, '1764537768_739718080_remera-allende-conjunto (1).jpg', NULL, 1, 'App\\Variation', NULL, NULL, 341, '2025-11-30 18:22:48', '2025-12-27 22:32:30'),
(101, 1, '1764537768_168664233_remera-allende-conjunto.jpg', NULL, 1, 'App\\Variation', NULL, NULL, 342, '2025-11-30 18:22:48', '2025-12-27 22:32:30'),
(102, 1, '1764538324_2091143160_short-cancun-conjunto (5).jpg', NULL, 1, 'App\\Variation', 591, NULL, 343, '2025-11-30 18:32:04', '2025-12-27 22:52:33'),
(103, 1, '1764538324_138739303_short-cancun-conjunto (7).jpg', NULL, 1, 'App\\Variation', 591, NULL, 344, '2025-11-30 18:32:04', '2025-12-27 22:52:33'),
(104, 1, '1764538324_844482547_short-cancun-conjunto (3).jpg', NULL, 1, 'App\\Variation', 591, NULL, 345, '2025-11-30 18:32:04', '2025-12-27 22:52:33'),
(105, 1, '1764538771_1732766430_remera-cancun-conjunto.jpg', NULL, 1, 'App\\Variation', 720, NULL, 352, '2025-11-30 18:39:31', '2025-12-27 22:52:39'),
(106, 1, '1764538771_760173044_short-cancun-conjunto (7).jpg', NULL, 1, 'App\\Variation', 597, NULL, 353, '2025-11-30 18:39:31', '2025-12-27 22:52:39'),
(107, 1, '1764538771_1573605012_short-cancun-conjunto (6).jpg', NULL, 1, 'App\\Variation', 597, NULL, 354, '2025-11-30 18:39:31', '2025-12-27 22:52:39'),
(108, 1, '1764539063_1199215032_remera-oaxaca (7).jpg', NULL, 1, 'App\\Variation', 599, NULL, 355, '2025-11-30 18:44:23', '2025-12-27 22:52:40'),
(109, 1, '1764539063_1139708437_remera-oaxaca (2).jpg', NULL, 1, 'App\\Variation', 599, NULL, 356, '2025-11-30 18:44:23', '2025-12-27 22:52:40'),
(110, 1, '1765138025_355451518_short-allende-conjunto (3).jpg', NULL, 1, 'App\\Variation', 677, NULL, 450, '2025-12-07 20:07:05', '2025-12-27 22:53:29'),
(111, 1, '1765138025_1464074531_short-allende-conjunto (6).jpg', NULL, 1, 'App\\Variation', 677, NULL, 451, '2025-12-07 20:07:05', '2025-12-27 22:53:29'),
(112, 1, '1765138025_1802019254_short-allende-conjunto (5).jpg', NULL, 1, 'App\\Variation', 677, NULL, 452, '2025-12-07 20:07:05', '2025-12-27 22:53:29');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(191) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2014_10_12_000000_create_users_table', 1),
(2, '2014_10_12_100000_create_password_resets_table', 1),
(3, '2016_06_01_000001_create_oauth_auth_codes_table', 1),
(4, '2016_06_01_000002_create_oauth_access_tokens_table', 1),
(5, '2016_06_01_000003_create_oauth_refresh_tokens_table', 1),
(6, '2016_06_01_000004_create_oauth_clients_table', 1),
(7, '2016_06_01_000005_create_oauth_personal_access_clients_table', 1),
(8, '2017_07_05_071953_create_currencies_table', 1),
(9, '2017_07_05_073658_create_business_table', 1),
(10, '2017_07_22_075923_add_business_id_users_table', 1),
(11, '2017_07_23_113209_create_brands_table', 1),
(12, '2017_07_26_083429_create_permission_tables', 1),
(13, '2017_07_26_110000_create_tax_rates_table', 1),
(14, '2017_07_26_122313_create_units_table', 1),
(15, '2017_07_27_075706_create_contacts_table', 1),
(16, '2017_08_04_071038_create_categories_table', 1),
(17, '2017_08_08_115903_create_products_table', 1),
(18, '2017_08_09_061616_create_variation_templates_table', 1),
(19, '2017_08_09_061638_create_variation_value_templates_table', 1),
(20, '2017_08_10_061146_create_product_variations_table', 1),
(21, '2017_08_10_061216_create_variations_table', 1),
(22, '2017_08_19_054827_create_transactions_table', 1),
(23, '2017_08_31_073533_create_purchase_lines_table', 1),
(24, '2017_10_15_064638_create_transaction_payments_table', 1),
(25, '2017_10_31_065621_add_default_sales_tax_to_business_table', 1),
(26, '2017_11_20_051930_create_table_group_sub_taxes', 1),
(27, '2017_11_20_063603_create_transaction_sell_lines', 1),
(28, '2017_11_21_064540_create_barcodes_table', 1),
(29, '2017_11_23_181237_create_invoice_schemes_table', 1),
(30, '2017_12_25_122822_create_business_locations_table', 1),
(31, '2017_12_25_160253_add_location_id_to_transactions_table', 1),
(32, '2017_12_25_163227_create_variation_location_details_table', 1),
(33, '2018_01_04_115627_create_sessions_table', 1),
(34, '2018_01_05_112817_create_invoice_layouts_table', 1),
(35, '2018_01_06_112303_add_invoice_scheme_id_and_invoice_layout_id_to_business_locations', 1),
(36, '2018_01_08_104124_create_expense_categories_table', 1),
(37, '2018_01_08_123327_modify_transactions_table_for_expenses', 1),
(38, '2018_01_09_111005_modify_payment_status_in_transactions_table', 1),
(39, '2018_01_09_111109_add_paid_on_column_to_transaction_payments_table', 1),
(40, '2018_01_25_172439_add_printer_related_fields_to_business_locations_table', 1),
(41, '2018_01_27_184322_create_printers_table', 1),
(42, '2018_01_30_181442_create_cash_registers_table', 1),
(43, '2018_01_31_125836_create_cash_register_transactions_table', 1),
(44, '2018_02_07_173326_modify_business_table', 1),
(45, '2018_02_08_105425_add_enable_product_expiry_column_to_business_table', 1),
(46, '2018_02_08_111027_add_expiry_period_and_expiry_period_type_columns_to_products_table', 1),
(47, '2018_02_08_131118_add_mfg_date_and_exp_date_purchase_lines_table', 1),
(48, '2018_02_08_155348_add_exchange_rate_to_transactions_table', 1),
(49, '2018_02_09_124945_modify_transaction_payments_table_for_contact_payments', 1),
(50, '2018_02_12_113640_create_transaction_sell_lines_purchase_lines_table', 1),
(51, '2018_02_12_114605_add_quantity_sold_in_purchase_lines_table', 1),
(52, '2018_02_13_183323_alter_decimal_fields_size', 1),
(53, '2018_02_14_161928_add_transaction_edit_days_to_business_table', 1),
(54, '2018_02_15_161032_add_document_column_to_transactions_table', 1),
(55, '2018_02_17_124709_add_more_options_to_invoice_layouts', 1),
(56, '2018_02_19_111517_add_keyboard_shortcut_column_to_business_table', 1),
(57, '2018_02_19_121537_stock_adjustment_move_to_transaction_table', 1),
(58, '2018_02_20_165505_add_is_direct_sale_column_to_transactions_table', 1),
(59, '2018_02_21_105329_create_system_table', 1),
(60, '2018_02_23_100549_version_1_2', 1),
(61, '2018_02_23_125648_add_enable_editing_sp_from_purchase_column_to_business_table', 1),
(62, '2018_02_26_103612_add_sales_commission_agent_column_to_business_table', 1),
(63, '2018_02_26_130519_modify_users_table_for_sales_cmmsn_agnt', 1),
(64, '2018_02_26_134500_add_commission_agent_to_transactions_table', 1),
(65, '2018_02_27_121422_add_item_addition_method_to_business_table', 1),
(66, '2018_02_27_170232_modify_transactions_table_for_stock_transfer', 1),
(67, '2018_03_05_153510_add_enable_inline_tax_column_to_business_table', 1),
(68, '2018_03_06_210206_modify_product_barcode_types', 1),
(69, '2018_03_13_181541_add_expiry_type_to_business_table', 1),
(70, '2018_03_16_113446_product_expiry_setting_for_business', 1),
(71, '2018_03_19_113601_add_business_settings_options', 1),
(72, '2018_03_26_125334_add_pos_settings_to_business_table', 1),
(73, '2018_03_26_165350_create_customer_groups_table', 1),
(74, '2018_03_27_122720_customer_group_related_changes_in_tables', 1),
(75, '2018_03_29_110138_change_tax_field_to_nullable_in_business_table', 1),
(76, '2018_03_29_115502_add_changes_for_sr_number_in_products_and_sale_lines_table', 1),
(77, '2018_03_29_134340_add_inline_discount_fields_in_purchase_lines', 1),
(78, '2018_03_31_140921_update_transactions_table_exchange_rate', 1),
(79, '2018_04_03_103037_add_contact_id_to_contacts_table', 1),
(80, '2018_04_03_122709_add_changes_to_invoice_layouts_table', 1),
(81, '2018_04_09_135320_change_exchage_rate_size_in_business_table', 1),
(82, '2018_04_17_123122_add_lot_number_to_business', 1),
(83, '2018_04_17_160845_add_product_racks_table', 1),
(84, '2018_04_20_182015_create_res_tables_table', 1),
(85, '2018_04_24_105246_restaurant_fields_in_transaction_table', 1),
(86, '2018_04_24_114149_add_enabled_modules_business_table', 1),
(87, '2018_04_24_133704_add_modules_fields_in_invoice_layout_table', 1),
(88, '2018_04_27_132653_quotation_related_change', 1),
(89, '2018_05_02_104439_add_date_format_and_time_format_to_business', 1),
(90, '2018_05_02_111939_add_sell_return_to_transaction_payments', 1),
(91, '2018_05_14_114027_add_rows_positions_for_products', 1),
(92, '2018_05_14_125223_add_weight_to_products_table', 1),
(93, '2018_05_14_164754_add_opening_stock_permission', 1),
(94, '2018_05_15_134729_add_design_to_invoice_layouts', 1),
(95, '2018_05_16_183307_add_tax_fields_invoice_layout', 1),
(96, '2018_05_18_191956_add_sell_return_to_transaction_table', 1),
(97, '2018_05_21_131349_add_custom_fileds_to_contacts_table', 1),
(98, '2018_05_21_131607_invoice_layout_fields_for_sell_return', 1),
(99, '2018_05_21_131949_add_custom_fileds_and_website_to_business_locations_table', 1),
(100, '2018_05_22_123527_create_reference_counts_table', 1),
(101, '2018_05_22_154540_add_ref_no_prefixes_column_to_business_table', 1),
(102, '2018_05_24_132620_add_ref_no_column_to_transaction_payments_table', 1),
(103, '2018_05_24_161026_add_location_id_column_to_business_location_table', 1),
(104, '2018_05_25_180603_create_modifiers_related_table', 1),
(105, '2018_05_29_121714_add_purchase_line_id_to_stock_adjustment_line_table', 1),
(106, '2018_05_31_114645_add_res_order_status_column_to_transactions_table', 1),
(107, '2018_06_05_103530_rename_purchase_line_id_in_stock_adjustment_lines_table', 1),
(108, '2018_06_05_111905_modify_products_table_for_modifiers', 1),
(109, '2018_06_06_110524_add_parent_sell_line_id_column_to_transaction_sell_lines_table', 1),
(110, '2018_06_07_152443_add_is_service_staff_to_roles_table', 1),
(111, '2018_06_07_182258_add_image_field_to_products_table', 1),
(112, '2018_06_13_133705_create_bookings_table', 1),
(113, '2018_06_15_173636_add_email_column_to_contacts_table', 1),
(114, '2018_06_27_182835_add_superadmin_related_fields_business', 1),
(115, '2018_07_10_101913_add_custom_fields_to_products_table', 1),
(116, '2018_07_17_103434_add_sales_person_name_label_to_invoice_layouts_table', 1),
(117, '2018_07_17_163920_add_theme_skin_color_column_to_business_table', 1),
(118, '2018_07_24_160319_add_lot_no_line_id_to_transaction_sell_lines_table', 1),
(119, '2018_07_25_110004_add_show_expiry_and_show_lot_colums_to_invoice_layouts_table', 1),
(120, '2018_07_25_172004_add_discount_columns_to_transaction_sell_lines_table', 1),
(121, '2018_07_26_124720_change_design_column_type_in_invoice_layouts_table', 1),
(122, '2018_07_26_170424_add_unit_price_before_discount_column_to_transaction_sell_line_table', 1),
(123, '2018_07_28_103614_add_credit_limit_column_to_contacts_table', 1),
(124, '2018_08_08_110755_add_new_payment_methods_to_transaction_payments_table', 1),
(125, '2018_08_08_122225_modify_cash_register_transactions_table_for_new_payment_methods', 1),
(126, '2018_08_14_104036_add_opening_balance_type_to_transactions_table', 1),
(127, '2018_09_04_155900_create_accounts_table', 1),
(128, '2018_09_06_114438_create_selling_price_groups_table', 1),
(129, '2018_09_06_154057_create_variation_group_prices_table', 1),
(130, '2018_09_07_102413_add_permission_to_access_default_selling_price', 1),
(131, '2018_09_07_134858_add_selling_price_group_id_to_transactions_table', 1),
(132, '2018_09_10_112448_update_product_type_to_single_if_null_in_products_table', 1),
(133, '2018_09_10_152703_create_account_transactions_table', 1),
(134, '2018_09_10_173656_add_account_id_column_to_transaction_payments_table', 1),
(135, '2018_09_19_123914_create_notification_templates_table', 1),
(136, '2018_09_22_110504_add_sms_and_email_settings_columns_to_business_table', 1),
(137, '2018_09_24_134942_add_lot_no_line_id_to_stock_adjustment_lines_table', 1),
(138, '2018_09_26_105557_add_transaction_payments_for_existing_expenses', 1),
(139, '2018_09_27_111609_modify_transactions_table_for_purchase_return', 1),
(140, '2018_09_27_131154_add_quantity_returned_column_to_purchase_lines_table', 1),
(141, '2018_10_02_131401_add_return_quantity_column_to_transaction_sell_lines_table', 1),
(142, '2018_10_03_104918_add_qty_returned_column_to_transaction_sell_lines_purchase_lines_table', 1),
(143, '2018_10_03_185947_add_default_notification_templates_to_database', 1),
(144, '2018_10_09_153105_add_business_id_to_transaction_payments_table', 1),
(145, '2018_10_16_135229_create_permission_for_sells_and_purchase', 1),
(146, '2018_10_22_114441_add_columns_for_variable_product_modifications', 1),
(147, '2018_10_22_134428_modify_variable_product_data', 1),
(148, '2018_10_30_181558_add_table_tax_headings_to_invoice_layout', 1),
(149, '2018_10_31_122619_add_pay_terms_field_transactions_table', 1),
(150, '2018_10_31_161328_add_new_permissions_for_pos_screen', 1),
(151, '2018_10_31_174752_add_access_selected_contacts_only_to_users_table', 1),
(152, '2018_10_31_175627_add_user_contact_access', 1),
(153, '2018_10_31_180559_add_auto_send_sms_column_to_notification_templates_table', 1),
(154, '2018_11_02_171949_change_card_type_column_to_varchar_in_transaction_payments_table', 1),
(155, '2018_11_08_105621_add_role_permissions', 1),
(156, '2018_11_26_114135_add_is_suspend_column_to_transactions_table', 1),
(157, '2018_11_28_104410_modify_units_table_for_multi_unit', 1),
(158, '2018_11_28_170952_add_sub_unit_id_to_purchase_lines_and_sell_lines', 1),
(159, '2018_11_29_115918_add_primary_key_in_system_table', 1),
(160, '2018_12_03_185546_add_product_description_column_to_products_table', 1),
(161, '2018_12_06_114937_modify_system_table_and_users_table', 1),
(162, '2018_12_13_160007_add_custom_fields_display_options_to_invoice_layouts_table', 1),
(163, '2018_12_14_103307_modify_system_table', 1),
(164, '2018_12_18_133837_add_prev_balance_due_columns_to_invoice_layouts_table', 1),
(165, '2018_12_18_170656_add_invoice_token_column_to_transaction_table', 1),
(166, '2018_12_20_133639_add_date_time_format_column_to_invoice_layouts_table', 1),
(167, '2018_12_21_120659_add_recurring_invoice_fields_to_transactions_table', 1),
(168, '2018_12_24_154933_create_notifications_table', 1),
(169, '2019_01_08_112015_add_document_column_to_transaction_payments_table', 1),
(170, '2019_01_10_124645_add_account_permission', 1),
(171, '2019_01_16_125825_add_subscription_no_column_to_transactions_table', 1),
(172, '2019_01_28_111647_add_order_addresses_column_to_transactions_table', 1),
(173, '2019_02_13_173821_add_is_inactive_column_to_products_table', 1),
(174, '2019_02_19_103118_create_discounts_table', 1),
(175, '2019_02_21_120324_add_discount_id_column_to_transaction_sell_lines_table', 1),
(176, '2019_02_21_134324_add_permission_for_discount', 1),
(177, '2019_03_04_170832_add_service_staff_columns_to_transaction_sell_lines_table', 1),
(178, '2019_03_09_102425_add_sub_type_column_to_transactions_table', 1),
(179, '2019_03_09_124457_add_indexing_transaction_sell_lines_purchase_lines_table', 1),
(180, '2019_03_12_120336_create_activity_log_table', 1),
(181, '2019_03_15_132925_create_media_table', 1),
(182, '2019_05_08_130339_add_indexing_to_parent_id_in_transaction_payments_table', 1),
(183, '2019_05_10_132311_add_missing_column_indexing', 1),
(184, '2019_05_14_091812_add_show_image_column_to_invoice_layouts_table', 1),
(185, '2019_05_25_104922_add_view_purchase_price_permission', 1),
(186, '2019_06_17_103515_add_profile_informations_columns_to_users_table', 1),
(187, '2019_06_18_135524_add_permission_to_view_own_sales_only', 1),
(188, '2019_06_19_112058_add_database_changes_for_reward_points', 1),
(189, '2019_06_28_133732_change_type_column_to_string_in_transactions_table', 1),
(190, '2019_07_13_111420_add_is_created_from_api_column_to_transactions_table', 1),
(191, '2019_07_15_165136_add_fields_for_combo_product', 1),
(192, '2019_07_19_103446_add_mfg_quantity_used_column_to_purchase_lines_table', 1),
(193, '2019_07_22_152649_add_not_for_selling_in_product_table', 1),
(194, '2019_07_29_185351_add_show_reward_point_column_to_invoice_layouts_table', 1),
(195, '2019_08_08_162302_add_sub_units_related_fields', 1),
(196, '2019_08_26_133419_update_price_fields_decimal_point', 1),
(197, '2019_09_02_160054_remove_location_permissions_from_roles', 1),
(198, '2019_09_03_185259_add_permission_for_pos_screen', 1),
(199, '2019_09_04_163141_add_location_id_to_cash_registers_table', 1),
(200, '2019_09_04_184008_create_types_of_services_table', 1),
(201, '2019_09_06_131445_add_types_of_service_fields_to_transactions_table', 1),
(202, '2019_09_09_134810_add_default_selling_price_group_id_column_to_business_locations_table', 1),
(203, '2019_09_12_105616_create_product_locations_table', 1),
(204, '2019_09_17_122522_add_custom_labels_column_to_business_table', 1),
(205, '2019_09_18_164319_add_shipping_fields_to_transactions_table', 1),
(206, '2019_09_19_170927_close_all_active_registers', 1),
(207, '2019_09_23_161906_add_media_description_cloumn_to_media_table', 1),
(208, '2019_10_18_155633_create_account_types_table', 1),
(209, '2019_10_22_163335_add_common_settings_column_to_business_table', 1),
(210, '2019_10_29_132521_add_update_purchase_status_permission', 1),
(211, '2019_11_09_110522_add_indexing_to_lot_number', 1),
(212, '2019_11_19_170824_add_is_active_column_to_business_locations_table', 1),
(213, '2019_11_21_162913_change_quantity_field_types_to_decimal', 1),
(214, '2019_11_25_160340_modify_categories_table_for_polymerphic_relationship', 1),
(215, '2019_12_02_105025_create_warranties_table', 1),
(216, '2019_12_03_180342_add_common_settings_field_to_invoice_layouts_table', 1),
(217, '2019_12_05_183955_add_more_fields_to_users_table', 1),
(218, '2019_12_06_174904_add_change_return_label_column_to_invoice_layouts_table', 1),
(219, '2019_12_11_121307_add_draft_and_quotation_list_permissions', 1),
(220, '2019_12_12_180126_copy_expense_total_to_total_before_tax', 1),
(221, '2019_12_19_181412_make_alert_quantity_field_nullable_on_products_table', 1),
(222, '2019_12_25_173413_create_dashboard_configurations_table', 1),
(223, '2020_01_08_133506_create_document_and_notes_table', 1),
(224, '2020_01_09_113252_add_cc_bcc_column_to_notification_templates_table', 1),
(225, '2020_01_16_174818_add_round_off_amount_field_to_transactions_table', 1),
(226, '2020_01_28_162345_add_weighing_scale_settings_in_business_settings_table', 1),
(227, '2020_02_18_172447_add_import_fields_to_transactions_table', 1),
(228, '2020_03_13_135844_add_is_active_column_to_selling_price_groups_table', 1),
(229, '2020_03_16_115449_add_contact_status_field_to_contacts_table', 1),
(230, '2020_03_26_124736_add_allow_login_column_in_users_table', 1),
(231, '2020_04_13_154150_add_feature_products_column_to_business_loactions', 1),
(232, '2020_04_15_151802_add_user_type_to_users_table', 1),
(233, '2020_04_22_153905_add_subscription_repeat_on_column_to_transactions_table', 1),
(234, '2020_04_28_111436_add_shipping_address_to_contacts_table', 1),
(235, '2020_06_01_094654_add_max_sale_discount_column_to_users_table', 1),
(236, '2020_06_12_162245_modify_contacts_table', 1),
(237, '2020_06_22_103104_change_recur_interval_default_to_one', 1),
(238, '2020_07_09_174621_add_balance_field_to_contacts_table', 1),
(239, '2020_07_23_104933_change_status_column_to_varchar_in_transaction_table', 1),
(240, '2020_09_07_171059_change_completed_stock_transfer_status_to_final', 1),
(241, '2020_09_21_123224_modify_booking_status_column_in_bookings_table', 1),
(242, '2020_09_22_121639_create_discount_variations_table', 1),
(243, '2020_10_05_121550_modify_business_location_table_for_invoice_layout', 1),
(244, '2020_10_16_175726_set_status_as_received_for_opening_stock', 1),
(245, '2020_10_23_170823_add_for_group_tax_column_to_tax_rates_table', 1),
(246, '2020_11_04_130940_add_more_custom_fields_to_contacts_table', 1),
(247, '2020_11_10_152841_add_cash_register_permissions', 1),
(248, '2020_11_17_164041_modify_type_column_to_varchar_in_contacts_table', 1),
(249, '2020_12_18_181447_add_shipping_custom_fields_to_transactions_table', 1),
(250, '2020_12_22_164303_add_sub_status_column_to_transactions_table', 1),
(251, '2020_12_24_153050_add_custom_fields_to_transactions_table', 1),
(252, '2020_12_28_105403_add_whatsapp_text_column_to_notification_templates_table', 1),
(253, '2020_12_29_165925_add_model_document_type_to_media_table', 1),
(254, '2021_02_08_175632_add_contact_number_fields_to_users_table', 1),
(255, '2021_02_11_172217_add_indexing_for_multiple_columns', 1),
(256, '2021_02_23_122043_add_more_columns_to_customer_groups_table', 1),
(257, '2021_02_24_175551_add_print_invoice_permission_to_all_roles', 1),
(258, '2021_03_03_162021_add_purchase_order_columns_to_purchase_lines_and_transactions_table', 1),
(259, '2021_03_11_120229_add_sales_order_columns', 1),
(260, '2021_03_16_120705_add_business_id_to_activity_log_table', 1),
(261, '2021_03_16_153427_add_code_columns_to_business_table', 1),
(262, '2021_03_18_173308_add_account_details_column_to_accounts_table', 1),
(263, '2021_03_18_183119_add_prefer_payment_account_columns_to_transactions_table', 1),
(264, '2021_03_22_120810_add_more_types_of_service_custom_fields', 1),
(265, '2021_03_24_183132_add_shipping_export_custom_field_details_to_contacts_table', 1),
(266, '2021_03_25_170715_add_export_custom_fields_info_to_transactions_table', 1),
(267, '2021_04_15_063449_add_denominations_column_to_cash_registers_table', 1),
(268, '2021_05_22_083426_add_indexing_to_account_transactions_table', 1),
(269, '2021_07_08_065808_add_additional_expense_columns_to_transaction_table', 1),
(270, '2021_07_13_082918_add_qr_code_columns_to_invoice_layouts_table', 1),
(271, '2021_07_21_061615_add_fields_to_show_commission_agent_in_invoice_layout', 1),
(272, '2021_08_13_105549_add_crm_contact_id_to_users_table', 1),
(273, '2021_08_25_114932_add_payment_link_fields_to_transaction_payments_table', 1),
(274, '2021_09_01_063110_add_spg_column_to_discounts_table', 1),
(275, '2021_09_03_061528_modify_cash_register_transactions_table', 1),
(276, '2021_10_05_061658_add_source_column_to_transactions_table', 1),
(277, '2021_12_16_121851_add_parent_id_column_to_expense_categories_table', 1),
(278, '2022_04_14_075120_add_payment_type_column_to_transaction_payments_table', 1),
(279, '2022_04_21_083327_create_cash_denominations_table', 1),
(280, '2022_05_10_055307_add_delivery_date_column_to_transactions_table', 1),
(281, '2022_06_13_123135_add_currency_precision_and_quantity_precision_fields_to_business_table', 1),
(282, '2022_06_28_133342_add_secondary_unit_columns_to_products_sell_line_purchase_lines_tables', 1),
(283, '2022_07_13_114307_create_purchase_requisition_related_columns', 1),
(284, '2022_08_25_132707_add_service_staff_timer_fields_to_products_and_users_table', 1),
(285, '2023_01_28_114255_add_letter_head_column_to_invoice_layouts_table', 1),
(286, '2023_02_11_161510_add_event_column_to_activity_log_table', 1),
(287, '2023_02_11_161511_add_batch_uuid_column_to_activity_log_table', 1),
(288, '2023_03_02_170312_add_provider_to_oauth_clients_table', 1),
(289, '2023_03_21_122731_add_sale_invoice_scheme_id_business_table', 1),
(290, '2023_03_21_170446_add_number_type_to_invoice_scheme', 1),
(291, '2023_04_17_155216_add_custom_fields_to_products', 1),
(292, '2023_04_28_130247_add_price_type_to_group_price_table', 1),
(293, '2023_06_21_033923_add_delivery_person_in_transactions', 1),
(294, '2023_09_13_153555_add_service_staff_pin_columns_in_users', 1),
(295, '2023_09_15_154404_add_is_kitchen_order_in_transactions', 1),
(296, '2023_12_06_152840_add_contact_type_in_contacts', 1),
(297, '2024_10_03_151459_modify_transaction_sell_lines_purchase_lines_table', 1),
(298, '2025_03_07_114637_add_more_addresh_column_in_contact', 1),
(299, '2025_09_19_120000_add_previous_balance_due_fields_to_invoice_layouts_table', 1),
(300, '2018_10_10_110400_add_module_version_to_system_table', 2),
(301, '2018_10_10_122845_add_woocommerce_api_settings_to_business_table', 2),
(302, '2018_10_10_162041_add_woocommerce_category_id_to_categories_table', 2),
(303, '2018_10_11_173839_create_woocommerce_sync_logs_table', 2),
(304, '2018_10_16_123522_add_woocommerce_tax_rate_id_column_to_tax_rates_table', 2),
(305, '2018_10_23_111555_add_woocommerce_attr_id_column_to_variation_templates_table', 2),
(306, '2018_12_03_163945_add_woocommerce_permissions', 2),
(307, '2019_02_18_154414_change_woocommerce_sync_logs_table', 2),
(308, '2019_04_19_174129_add_disable_woocommerce_sync_column_to_products_table', 2),
(309, '2019_06_08_132440_add_woocommerce_wh_oc_secret_column_to_business_table', 2),
(310, '2019_10_01_171828_add_woocommerce_media_id_columns', 2),
(311, '2020_09_07_124952_add_woocommerce_skipped_orders_fields_to_business_table', 2),
(312, '2021_02_16_190608_add_woocommerce_module_indexing', 2),
(313, '2020_03_19_130231_add_contact_id_to_users_table', 3),
(314, '2020_03_27_133605_create_schedules_table', 3),
(315, '2020_03_27_133628_create_schedule_users_table', 3),
(316, '2020_03_30_112834_create_schedule_logs_table', 3),
(317, '2020_04_02_182331_add_crm_module_version_to_system_table', 3),
(318, '2020_04_08_153231_modify_cloumn_in_contacts_table', 3),
(319, '2020_04_09_101052_create_lead_users_table', 3),
(320, '2020_04_16_114747_create_crm_campaigns_table', 3),
(321, '2021_01_07_155757_add_followup_additional_info_column_to_crm_schedules_table', 3),
(322, '2021_02_02_140021_add_additional_info_to_crm_campaigns_table', 3),
(323, '2021_02_02_173651_add_new_columns_to_contacts_table', 3),
(324, '2021_02_04_120439_create_call_logs_table', 3),
(325, '2021_02_08_172047_add_mobile_name_column_to_crm_call_logs_table', 3),
(326, '2021_02_16_190038_add_crm_module_indexing', 3),
(327, '2021_02_19_120846_create_crm_followup_invoices', 3),
(328, '2021_02_22_132125_add_follow_up_by_to_crm_schedules_table', 3),
(329, '2021_03_24_160736_add_department_and_designation_to_users_table', 3),
(330, '2021_06_15_152924_create_proposal_templates_table', 3),
(331, '2021_06_16_114448_add_recursive_fields_to_crm_schedules_table', 3),
(332, '2021_06_16_125740_create_proposals_table', 3),
(333, '2021_09_24_065738_add_crm_settings_column_to_business_table', 3),
(334, '2022_02_09_055012_create_crm_marketplaces_table', 3),
(335, '2022_02_17_113045_add_source_id_to_marketplace', 3),
(336, '2022_03_02_180929_add_followup_category_id', 3),
(337, '2022_05_26_061553_create_crm_contact_person_commissions_table', 3),
(338, '2022_06_06_073006_add_cc_and_bcc_columns_to_crm_proposals_table', 3),
(339, '2020_09_29_184909_add_product_catalogue_version', 4),
(340, '2018_10_01_151252_create_documents_table', 5),
(341, '2018_10_02_151803_create_document_shares_table', 5),
(342, '2018_10_09_134558_create_reminders_table', 5),
(343, '2018_11_16_170756_create_to_dos_table', 5),
(344, '2019_02_22_120329_essentials_messages', 5),
(345, '2019_02_22_161513_add_message_permissions', 5),
(346, '2019_03_29_164339_add_essentials_version_to_system_table', 5),
(347, '2019_05_17_153306_create_essentials_leave_types_table', 5),
(348, '2019_05_17_175921_create_essentials_leaves_table', 5),
(349, '2019_05_21_154517_add_essentials_settings_columns_to_business_table', 5),
(350, '2019_05_21_181653_create_table_essentials_attendance', 5),
(351, '2019_05_30_110049_create_essentials_payrolls_table', 5),
(352, '2019_06_04_105723_create_essentials_holidays_table', 5),
(353, '2019_06_28_134217_add_payroll_columns_to_transactions_table', 5),
(354, '2019_08_26_103520_add_approve_leave_permission', 5),
(355, '2019_08_27_103724_create_essentials_allowance_and_deduction_table', 5),
(356, '2019_08_27_105236_create_essentials_user_allowances_and_deductions', 5),
(357, '2019_09_20_115906_add_more_columns_to_essentials_to_dos_table', 5),
(358, '2019_09_23_120439_create_essentials_todo_comments_table', 5),
(359, '2019_12_05_170724_add_hrm_columns_to_users_table', 5),
(360, '2019_12_09_105809_add_allowance_and_deductions_permission', 5),
(361, '2020_03_28_152838_create_essentials_shift_table', 5),
(362, '2020_03_30_162029_create_user_shifts_table', 5),
(363, '2020_03_31_134558_add_shift_id_to_attendance_table', 5),
(364, '2020_11_05_105157_modify_todos_date_column_type', 5),
(365, '2020_11_11_174852_add_end_time_column_to_essentials_reminders_table', 5),
(366, '2020_11_26_170527_create_essentials_kb_table', 5),
(367, '2020_11_30_112615_create_essentials_kb_users_table', 5),
(368, '2021_02_12_185514_add_clock_in_location_to_essentials_attendances_table', 5),
(369, '2021_02_16_190203_add_essentials_module_indexing', 5),
(370, '2021_02_27_133448_add_columns_to_users_table', 5),
(371, '2021_03_04_174857_create_payroll_groups_table', 5),
(372, '2021_03_04_175025_create_payroll_group_transactions_table', 5),
(373, '2021_03_09_123914_add_auto_clockout_to_essentials_shifts', 5),
(374, '2021_06_17_121451_add_location_id_to_table', 5),
(375, '2021_09_28_091541_create_essentials_user_sales_targets_table', 5),
(376, '2020_08_18_123107_add_connector_module_version_to_system_table', 6),
(377, '2020_12_23_125610_add_spreadsheet_version_to_system_table', 7),
(378, '2020_12_23_153255_create_spreadsheets_table', 7),
(379, '2021_03_12_175416_create_spreadsheet_shares_table', 7),
(380, '2023_01_16_124948_add_folder_id_column_to_sheet_spreadsheets_table', 7);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `model_has_permissions`
--

CREATE TABLE `model_has_permissions` (
  `permission_id` int(10) UNSIGNED NOT NULL,
  `model_type` varchar(191) NOT NULL,
  `model_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `model_has_permissions`
--

INSERT INTO `model_has_permissions` (`permission_id`, `model_type`, `model_id`) VALUES
(80, 'App\\User', 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `model_has_roles`
--

CREATE TABLE `model_has_roles` (
  `role_id` int(10) UNSIGNED NOT NULL,
  `model_type` varchar(191) NOT NULL,
  `model_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `model_has_roles`
--

INSERT INTO `model_has_roles` (`role_id`, `model_type`, `model_id`) VALUES
(1, 'App\\User', 1),
(1, 'App\\User', 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notifications`
--

CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `type` varchar(191) NOT NULL,
  `notifiable_type` varchar(191) NOT NULL,
  `notifiable_id` bigint(20) UNSIGNED NOT NULL,
  `data` text NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notification_templates`
--

CREATE TABLE `notification_templates` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(11) NOT NULL,
  `template_for` varchar(191) NOT NULL,
  `email_body` text DEFAULT NULL,
  `sms_body` text DEFAULT NULL,
  `whatsapp_text` text DEFAULT NULL,
  `subject` varchar(191) DEFAULT NULL,
  `cc` varchar(191) DEFAULT NULL,
  `bcc` varchar(191) DEFAULT NULL,
  `auto_send` tinyint(1) NOT NULL DEFAULT 0,
  `auto_send_sms` tinyint(1) NOT NULL DEFAULT 0,
  `auto_send_wa_notif` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `notification_templates`
--

INSERT INTO `notification_templates` (`id`, `business_id`, `template_for`, `email_body`, `sms_body`, `whatsapp_text`, `subject`, `cc`, `bcc`, `auto_send`, `auto_send_sms`, `auto_send_wa_notif`, `created_at`, `updated_at`) VALUES
(1, 1, 'new_sale', '<p>Dear {contact_name},</p>\n\n                    <p>Your invoice number is {invoice_number}<br />\n                    Total amount: {total_amount}<br />\n                    Paid amount: {received_amount}</p>\n\n                    <p>Thank you for shopping with us.</p>\n\n                    <p>{business_logo}</p>\n\n                    <p>&nbsp;</p>', 'Dear {contact_name}, Thank you for shopping with us. {business_name}', NULL, 'Thank you from {business_name}', NULL, NULL, 0, 0, 0, '2025-10-29 02:51:02', '2025-10-29 02:51:02'),
(2, 1, 'payment_received', '<p>Dear {contact_name},</p>\n\n                <p>We have received a payment of {received_amount}</p>\n\n                <p>{business_logo}</p>', 'Dear {contact_name}, We have received a payment of {received_amount}. {business_name}', NULL, 'Payment Received, from {business_name}', NULL, NULL, 0, 0, 0, '2025-10-29 02:51:02', '2025-10-29 02:51:02'),
(3, 1, 'payment_reminder', '<p>Dear {contact_name},</p>\n\n                    <p>This is to remind you that you have pending payment of {due_amount}. Kindly pay it as soon as possible.</p>\n\n                    <p>{business_logo}</p>', 'Dear {contact_name}, You have pending payment of {due_amount}. Kindly pay it as soon as possible. {business_name}', NULL, 'Payment Reminder, from {business_name}', NULL, NULL, 0, 0, 0, '2025-10-29 02:51:02', '2025-10-29 02:51:02'),
(4, 1, 'new_booking', '<p>Dear {contact_name},</p>\n\n                    <p>Your booking is confirmed</p>\n\n                    <p>Date: {start_time} to {end_time}</p>\n\n                    <p>Table: {table}</p>\n\n                    <p>Location: {location}</p>\n\n                    <p>{business_logo}</p>', 'Dear {contact_name}, Your booking is confirmed. Date: {start_time} to {end_time}, Table: {table}, Location: {location}', NULL, 'Booking Confirmed - {business_name}', NULL, NULL, 0, 0, 0, '2025-10-29 02:51:02', '2025-10-29 02:51:02'),
(5, 1, 'new_order', '<p>Dear {contact_name},</p>\n\n                    <p>We have a new order with reference number {order_ref_number}. Kindly process the products as soon as possible.</p>\n\n                    <p>{business_name}<br />\n                    {business_logo}</p>', 'Dear {contact_name}, We have a new order with reference number {order_ref_number}. Kindly process the products as soon as possible. {business_name}', NULL, 'New Order, from {business_name}', NULL, NULL, 0, 0, 0, '2025-10-29 02:51:02', '2025-10-29 02:51:02'),
(6, 1, 'payment_paid', '<p>Dear {contact_name},</p>\n\n                    <p>We have paid amount {paid_amount} again invoice number {order_ref_number}.<br />\n                    Kindly note it down.</p>\n\n                    <p>{business_name}<br />\n                    {business_logo}</p>', 'We have paid amount {paid_amount} again invoice number {order_ref_number}.\n                    Kindly note it down. {business_name}', NULL, 'Payment Paid, from {business_name}', NULL, NULL, 0, 0, 0, '2025-10-29 02:51:02', '2025-10-29 02:51:02'),
(7, 1, 'items_received', '<p>Dear {contact_name},</p>\n\n                    <p>We have received all items from invoice reference number {order_ref_number}. Thank you for processing it.</p>\n\n                    <p>{business_name}<br />\n                    {business_logo}</p>', 'We have received all items from invoice reference number {order_ref_number}. Thank you for processing it. {business_name}', NULL, 'Items received, from {business_name}', NULL, NULL, 0, 0, 0, '2025-10-29 02:51:02', '2025-10-29 02:51:02'),
(8, 1, 'items_pending', '<p>Dear {contact_name},<br />\n                    This is to remind you that we have not yet received some items from invoice reference number {order_ref_number}. Please process it as soon as possible.</p>\n\n                    <p>{business_name}<br />\n                    {business_logo}</p>', 'This is to remind you that we have not yet received some items from invoice reference number {order_ref_number} . Please process it as soon as possible.{business_name}', NULL, 'Items Pending, from {business_name}', NULL, NULL, 0, 0, 0, '2025-10-29 02:51:02', '2025-10-29 02:51:02'),
(9, 1, 'new_quotation', '<p>Dear {contact_name},</p>\n\n                    <p>Your quotation number is {invoice_number}<br />\n                    Total amount: {total_amount}</p>\n\n                    <p>Thank you for shopping with us.</p>\n\n                    <p>{business_logo}</p>\n\n                    <p>&nbsp;</p>', 'Dear {contact_name}, Thank you for shopping with us. {business_name}', NULL, 'Thank you from {business_name}', NULL, NULL, 0, 0, 0, '2025-10-29 02:51:02', '2025-10-29 02:51:02'),
(10, 1, 'purchase_order', '<p>Dear {contact_name},</p>\n\n                    <p>We have a new purchase order with reference number {order_ref_number}. The respective invoice is attached here with.</p>\n\n                    <p>{business_logo}</p>', 'We have a new purchase order with reference number {order_ref_number}. {business_name}', NULL, 'New Purchase Order, from {business_name}', NULL, NULL, 0, 0, 0, '2025-10-29 02:51:02', '2025-10-29 02:51:02');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `oauth_access_tokens`
--

CREATE TABLE `oauth_access_tokens` (
  `id` varchar(100) NOT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) DEFAULT NULL,
  `scopes` text DEFAULT NULL,
  `revoked` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `oauth_access_tokens`
--

INSERT INTO `oauth_access_tokens` (`id`, `user_id`, `client_id`, `name`, `scopes`, `revoked`, `created_at`, `updated_at`, `expires_at`) VALUES
('5fe862c2963b4fb835fbd91c6f962f4358096b395e3903ec9bea5f37ad4b324579f964102e8049d9', 1, 3, NULL, '[\"*\"]', 0, '2025-10-29 06:35:36', '2025-10-29 06:35:36', '2026-10-29 06:35:36'),
('7a33155347567b533d0ebd3a88fff22b39c7fac71ed77a5956b0da0f7ea4eac1a8e0f4ad57a59e80', 1, 20, NULL, '[\"*\"]', 0, '2025-12-09 04:45:56', '2025-12-09 04:45:56', '2026-12-09 01:45:56');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `oauth_auth_codes`
--

CREATE TABLE `oauth_auth_codes` (
  `id` varchar(100) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `scopes` text DEFAULT NULL,
  `revoked` tinyint(1) NOT NULL,
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `oauth_clients`
--

CREATE TABLE `oauth_clients` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `secret` varchar(100) NOT NULL,
  `provider` varchar(191) DEFAULT NULL,
  `redirect` text NOT NULL,
  `personal_access_client` tinyint(1) NOT NULL,
  `password_client` tinyint(1) NOT NULL,
  `revoked` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `oauth_clients`
--

INSERT INTO `oauth_clients` (`id`, `user_id`, `name`, `secret`, `provider`, `redirect`, `personal_access_client`, `password_client`, `revoked`, `created_at`, `updated_at`) VALUES
(1, NULL, 'Ro Stock Personal Access Client', '8Nvk0Rvhcfe3Zzzl75eJgCI0Pe5TwwKmDD6HX22o', NULL, 'http://localhost', 1, 0, 0, '2025-10-28 19:43:37', '2025-10-28 19:43:37'),
(2, NULL, 'Ro Stock Password Grant Client', 'r7wws7kyoSwYWlvTPySYRmhvJ4gKkx1hh9EWDVNw', 'users', 'http://localhost', 0, 1, 0, '2025-10-28 19:43:37', '2025-10-28 19:43:37'),
(4, NULL, 'Ro Stock Personal Access Client', 'hE9coDLKvNqSfal36b8UK4ePnicwqV3iqUtGjEEO', NULL, 'http://localhost', 1, 0, 0, '2025-10-28 19:56:51', '2025-10-28 19:56:51'),
(5, NULL, 'Ro Stock Password Grant Client', 'z777XBOIgD6r3VqKC9C9ugBJeeNfAA26LBB6dNNP', 'users', 'http://localhost', 0, 1, 0, '2025-10-28 19:56:51', '2025-10-28 19:56:51'),
(6, NULL, 'Ro Stock Personal Access Client', 'arSz7L3aXTzfnOoqN2FlEY2JDYvQnGnIs4w7O7Vk', NULL, 'http://localhost', 1, 0, 0, '2025-12-07 21:35:03', '2025-12-07 21:35:03'),
(7, NULL, 'Ro Stock Password Grant Client', 'vdne3BIIDWbSx4nMUVfq9YBRra948TFfvMy784YH', 'users', 'http://localhost', 0, 1, 0, '2025-12-07 21:35:03', '2025-12-07 21:35:03'),
(8, NULL, 'Ro Stock Personal Access Client', '9Bsz6YLmEZxtwzy7PNmwkljAKEiGyX6zmWAer99p', NULL, 'http://localhost', 1, 0, 0, '2025-12-07 22:13:32', '2025-12-07 22:13:32'),
(9, NULL, 'Ro Stock Password Grant Client', 'ZK2AGHffRUAIwhL3FEpx4UuyPkGhNcB3Z58ds2nW', 'users', 'http://localhost', 0, 1, 0, '2025-12-07 22:13:32', '2025-12-07 22:13:32'),
(10, NULL, 'Ro Stock Personal Access Client', 'yAEnZwFhyLnjcr4SMx9SdQ2C72yqluuvXUN4cQS0', NULL, 'http://localhost', 1, 0, 0, '2025-12-07 22:13:51', '2025-12-07 22:13:51'),
(11, NULL, 'Ro Stock Password Grant Client', 'lDUXx3vb0Ulep5wWETDfARhdUQHA5EDHohSzNZC4', 'users', 'http://localhost', 0, 1, 0, '2025-12-07 22:13:51', '2025-12-07 22:13:51'),
(12, NULL, 'Ro Stock Personal Access Client', 'FHZSYis94YFToPV7NCQxUGHnWiEMUvOP0lLvzywN', NULL, 'http://localhost', 1, 0, 0, '2025-12-07 22:13:56', '2025-12-07 22:13:56'),
(13, NULL, 'Ro Stock Password Grant Client', 'O10duUbp0GVa66bsy1okYJVQymaALkTmO4c4iXoO', 'users', 'http://localhost', 0, 1, 0, '2025-12-07 22:13:56', '2025-12-07 22:13:56'),
(14, NULL, 'Ro Stock Personal Access Client', 'uYOrrrQ4hWjRoM63i2W4LWmVfujXmo8ySN7GjNVH', NULL, 'http://localhost', 1, 0, 0, '2025-12-07 22:14:08', '2025-12-07 22:14:08'),
(15, NULL, 'Ro Stock Password Grant Client', 'rjca4uVXW81gn3ozHVB1KDDv38q5reWvbkUrHviy', 'users', 'http://localhost', 0, 1, 0, '2025-12-07 22:14:08', '2025-12-07 22:14:08'),
(16, NULL, 'Ro Stock Personal Access Client', 'uE6MNLNu7w5KszwuXrBDQl5wBUXP6XOiNtZBjCow', NULL, 'http://localhost', 1, 0, 0, '2025-12-07 22:14:42', '2025-12-07 22:14:42'),
(17, NULL, 'Ro Stock Password Grant Client', 'FwimNt0CJCSRDGpJB3bzKrXlTAejuOUd01djopOC', 'users', 'http://localhost', 0, 1, 0, '2025-12-07 22:14:42', '2025-12-07 22:14:42'),
(18, NULL, 'Ro Stock Personal Access Client', 'baOekOwzuP5dIYGGoh9wUHnFuf5AtGlTFl0eg4Eh', NULL, 'http://localhost', 1, 0, 0, '2025-12-08 19:50:50', '2025-12-08 19:50:50'),
(19, NULL, 'Ro Stock Password Grant Client', 'tOpIHkZ5IvMzxwHdKC7P9sCx4CGIEtDZCHGnGxh9', 'users', 'http://localhost', 0, 1, 0, '2025-12-08 19:50:50', '2025-12-08 19:50:50'),
(20, 1, 'Integraciones', 'fhrnrowkvEut6MF41yCbIUKSLsvruAkU29xi2Raz', NULL, 'http://localhost', 0, 1, 0, '2025-12-08 19:57:03', '2025-12-08 19:57:03'),
(21, NULL, 'Ro Stock Personal Access Client', 'OBwlOJxPJKAl9n2AmlXT17nlRSUP53L7dFg3VExL', NULL, 'http://localhost', 1, 0, 0, '2025-12-28 06:48:24', '2025-12-28 06:48:24'),
(22, NULL, 'Ro Stock Password Grant Client', 'dwcQimbBE1Qti1pzxeuCtTnrLl9fuItTuT6OiS65', 'users', 'http://localhost', 0, 1, 0, '2025-12-28 06:48:24', '2025-12-28 06:48:24');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `oauth_personal_access_clients`
--

CREATE TABLE `oauth_personal_access_clients` (
  `id` int(10) UNSIGNED NOT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `oauth_personal_access_clients`
--

INSERT INTO `oauth_personal_access_clients` (`id`, `client_id`, `created_at`, `updated_at`) VALUES
(1, 1, '2025-10-28 19:43:37', '2025-10-28 19:43:37'),
(2, 4, '2025-10-28 19:56:51', '2025-10-28 19:56:51'),
(3, 6, '2025-12-07 21:35:03', '2025-12-07 21:35:03'),
(4, 8, '2025-12-07 22:13:32', '2025-12-07 22:13:32'),
(5, 10, '2025-12-07 22:13:51', '2025-12-07 22:13:51'),
(6, 12, '2025-12-07 22:13:56', '2025-12-07 22:13:56'),
(7, 14, '2025-12-07 22:14:08', '2025-12-07 22:14:08'),
(8, 16, '2025-12-07 22:14:42', '2025-12-07 22:14:42'),
(9, 18, '2025-12-08 19:50:50', '2025-12-08 19:50:50'),
(10, 21, '2025-12-28 06:48:24', '2025-12-28 06:48:24');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `oauth_refresh_tokens`
--

CREATE TABLE `oauth_refresh_tokens` (
  `id` varchar(100) NOT NULL,
  `access_token_id` varchar(100) NOT NULL,
  `revoked` tinyint(1) NOT NULL,
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `oauth_refresh_tokens`
--

INSERT INTO `oauth_refresh_tokens` (`id`, `access_token_id`, `revoked`, `expires_at`) VALUES
('85f51c57862c681fc9b5944ab1a4176990792845a2878c93884fc5322a5a548ce5ee001e3356dde6', '7a33155347567b533d0ebd3a88fff22b39c7fac71ed77a5956b0da0f7ea4eac1a8e0f4ad57a59e80', 0, '2026-12-09 01:45:56'),
('da421cf4e9e03dbf9266a9dbd34ebef879566a7c8ec6b09e0437d80f86345c299ec0baef6852c879', '5fe862c2963b4fb835fbd91c6f962f4358096b395e3903ec9bea5f37ad4b324579f964102e8049d9', 0, '2026-10-29 06:35:36');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `password_resets`
--

CREATE TABLE `password_resets` (
  `email` varchar(191) NOT NULL,
  `token` varchar(191) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permissions`
--

CREATE TABLE `permissions` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `guard_name` varchar(191) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES
(1, 'profit_loss_report.view', 'web', '2025-10-29 02:49:51', NULL),
(2, 'direct_sell.access', 'web', '2025-10-29 02:49:51', NULL),
(3, 'product.opening_stock', 'web', '2025-10-29 02:49:51', '2025-10-29 02:49:51'),
(4, 'crud_all_bookings', 'web', '2025-10-29 02:49:51', '2025-10-29 02:49:51'),
(5, 'crud_own_bookings', 'web', '2025-10-29 02:49:51', '2025-10-29 02:49:51'),
(6, 'access_default_selling_price', 'web', '2025-10-29 02:49:52', '2025-10-29 02:49:52'),
(7, 'purchase.payments', 'web', '2025-10-29 02:49:52', '2025-10-29 02:49:52'),
(8, 'sell.payments', 'web', '2025-10-29 02:49:52', '2025-10-29 02:49:52'),
(9, 'edit_product_price_from_sale_screen', 'web', '2025-10-29 02:49:52', '2025-10-29 02:49:52'),
(10, 'edit_product_discount_from_sale_screen', 'web', '2025-10-29 02:49:52', '2025-10-29 02:49:52'),
(11, 'roles.view', 'web', '2025-10-29 02:49:52', '2025-10-29 02:49:52'),
(12, 'roles.create', 'web', '2025-10-29 02:49:52', '2025-10-29 02:49:52'),
(13, 'roles.update', 'web', '2025-10-29 02:49:52', '2025-10-29 02:49:52'),
(14, 'roles.delete', 'web', '2025-10-29 02:49:52', '2025-10-29 02:49:52'),
(15, 'account.access', 'web', '2025-10-29 02:49:52', '2025-10-29 02:49:52'),
(16, 'discount.access', 'web', '2025-10-29 02:49:52', '2025-10-29 02:49:52'),
(17, 'view_purchase_price', 'web', '2025-10-29 02:49:53', '2025-10-29 02:49:53'),
(18, 'view_own_sell_only', 'web', '2025-10-29 02:49:53', '2025-10-29 02:49:53'),
(19, 'edit_product_discount_from_pos_screen', 'web', '2025-10-29 02:49:53', '2025-10-29 02:49:53'),
(20, 'edit_product_price_from_pos_screen', 'web', '2025-10-29 02:49:53', '2025-10-29 02:49:53'),
(21, 'access_shipping', 'web', '2025-10-29 02:49:53', '2025-10-29 02:49:53'),
(22, 'purchase.update_status', 'web', '2025-10-29 02:49:53', '2025-10-29 02:49:53'),
(23, 'list_drafts', 'web', '2025-10-29 02:49:53', '2025-10-29 02:49:53'),
(24, 'list_quotations', 'web', '2025-10-29 02:49:53', '2025-10-29 02:49:53'),
(25, 'view_cash_register', 'web', '2025-10-29 02:49:54', '2025-10-29 02:49:54'),
(26, 'close_cash_register', 'web', '2025-10-29 02:49:54', '2025-10-29 02:49:54'),
(27, 'print_invoice', 'web', '2025-10-29 02:49:55', '2025-10-29 02:49:55'),
(28, 'user.view', 'web', '2025-10-29 02:49:56', NULL),
(29, 'user.create', 'web', '2025-10-29 02:49:56', NULL),
(30, 'user.update', 'web', '2025-10-29 02:49:56', NULL),
(31, 'user.delete', 'web', '2025-10-29 02:49:56', NULL),
(32, 'supplier.view', 'web', '2025-10-29 02:49:56', NULL),
(33, 'supplier.create', 'web', '2025-10-29 02:49:56', NULL),
(34, 'supplier.update', 'web', '2025-10-29 02:49:56', NULL),
(35, 'supplier.delete', 'web', '2025-10-29 02:49:56', NULL),
(36, 'customer.view', 'web', '2025-10-29 02:49:56', NULL),
(37, 'customer.create', 'web', '2025-10-29 02:49:56', NULL),
(38, 'customer.update', 'web', '2025-10-29 02:49:56', NULL),
(39, 'customer.delete', 'web', '2025-10-29 02:49:56', NULL),
(40, 'product.view', 'web', '2025-10-29 02:49:56', NULL),
(41, 'product.create', 'web', '2025-10-29 02:49:56', NULL),
(42, 'product.update', 'web', '2025-10-29 02:49:56', NULL),
(43, 'product.delete', 'web', '2025-10-29 02:49:56', NULL),
(44, 'purchase.view', 'web', '2025-10-29 02:49:56', NULL),
(45, 'purchase.create', 'web', '2025-10-29 02:49:56', NULL),
(46, 'purchase.update', 'web', '2025-10-29 02:49:56', NULL),
(47, 'purchase.delete', 'web', '2025-10-29 02:49:56', NULL),
(48, 'sell.view', 'web', '2025-10-29 02:49:56', NULL),
(49, 'sell.create', 'web', '2025-10-29 02:49:56', NULL),
(50, 'sell.update', 'web', '2025-10-29 02:49:56', NULL),
(51, 'sell.delete', 'web', '2025-10-29 02:49:56', NULL),
(52, 'purchase_n_sell_report.view', 'web', '2025-10-29 02:49:56', NULL),
(53, 'contacts_report.view', 'web', '2025-10-29 02:49:56', NULL),
(54, 'stock_report.view', 'web', '2025-10-29 02:49:56', NULL),
(55, 'tax_report.view', 'web', '2025-10-29 02:49:56', NULL),
(56, 'trending_product_report.view', 'web', '2025-10-29 02:49:56', NULL),
(57, 'register_report.view', 'web', '2025-10-29 02:49:56', NULL),
(58, 'sales_representative.view', 'web', '2025-10-29 02:49:56', NULL),
(59, 'expense_report.view', 'web', '2025-10-29 02:49:56', NULL),
(60, 'business_settings.access', 'web', '2025-10-29 02:49:56', NULL),
(61, 'barcode_settings.access', 'web', '2025-10-29 02:49:56', NULL),
(62, 'invoice_settings.access', 'web', '2025-10-29 02:49:56', NULL),
(63, 'brand.view', 'web', '2025-10-29 02:49:56', NULL),
(64, 'brand.create', 'web', '2025-10-29 02:49:56', NULL),
(65, 'brand.update', 'web', '2025-10-29 02:49:56', NULL),
(66, 'brand.delete', 'web', '2025-10-29 02:49:56', NULL),
(67, 'tax_rate.view', 'web', '2025-10-29 02:49:56', NULL),
(68, 'tax_rate.create', 'web', '2025-10-29 02:49:56', NULL),
(69, 'tax_rate.update', 'web', '2025-10-29 02:49:56', NULL),
(70, 'tax_rate.delete', 'web', '2025-10-29 02:49:56', NULL),
(71, 'unit.view', 'web', '2025-10-29 02:49:56', NULL),
(72, 'unit.create', 'web', '2025-10-29 02:49:56', NULL),
(73, 'unit.update', 'web', '2025-10-29 02:49:56', NULL),
(74, 'unit.delete', 'web', '2025-10-29 02:49:56', NULL),
(75, 'category.view', 'web', '2025-10-29 02:49:56', NULL),
(76, 'category.create', 'web', '2025-10-29 02:49:56', NULL),
(77, 'category.update', 'web', '2025-10-29 02:49:56', NULL),
(78, 'category.delete', 'web', '2025-10-29 02:49:56', NULL),
(79, 'expense.access', 'web', '2025-10-29 02:49:56', NULL),
(80, 'access_all_locations', 'web', '2025-10-29 02:49:56', NULL),
(81, 'dashboard.data', 'web', '2025-10-29 02:49:56', NULL),
(82, 'location.1', 'web', '2025-10-29 02:51:02', '2025-10-29 02:51:02'),
(83, 'woocommerce.syc_categories', 'web', '2025-10-28 18:24:14', '2025-10-28 18:24:14'),
(84, 'woocommerce.sync_products', 'web', '2025-10-28 18:24:14', '2025-10-28 18:24:14'),
(85, 'woocommerce.sync_orders', 'web', '2025-10-28 18:24:14', '2025-10-28 18:24:14'),
(86, 'woocommerce.map_tax_rates', 'web', '2025-10-28 18:24:14', '2025-10-28 18:24:14'),
(87, 'woocommerce.access_woocommerce_api_settings', 'web', '2025-10-28 18:24:14', '2025-10-28 18:24:14'),
(88, 'essentials.create_message', 'web', '2025-10-28 18:39:07', '2025-10-28 18:39:07'),
(89, 'essentials.view_message', 'web', '2025-10-28 18:39:07', '2025-10-28 18:39:07'),
(90, 'essentials.approve_leave', 'web', '2025-10-28 18:39:07', '2025-10-28 18:39:07'),
(91, 'essentials.assign_todos', 'web', '2025-10-28 18:39:07', '2025-10-28 18:39:07'),
(92, 'essentials.add_allowance_and_deduction', 'web', '2025-10-28 18:39:07', '2025-10-28 18:39:07'),
(93, 'selling_price_group.1', 'web', '2025-11-24 17:20:22', '2025-11-24 17:20:22');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `printers`
--

CREATE TABLE `printers` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `connection_type` enum('network','windows','linux') NOT NULL,
  `capability_profile` enum('default','simple','SP2000','TEP-200M','P822D') NOT NULL DEFAULT 'default',
  `char_per_line` varchar(191) DEFAULT NULL,
  `ip_address` varchar(191) DEFAULT NULL,
  `port` varchar(191) DEFAULT NULL,
  `path` varchar(191) DEFAULT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `products`
--

CREATE TABLE `products` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `type` enum('single','variable','modifier','combo') DEFAULT NULL,
  `unit_id` int(11) UNSIGNED DEFAULT NULL,
  `secondary_unit_id` int(11) DEFAULT NULL,
  `sub_unit_ids` text DEFAULT NULL,
  `brand_id` int(10) UNSIGNED DEFAULT NULL,
  `category_id` int(10) UNSIGNED DEFAULT NULL,
  `sub_category_id` int(10) UNSIGNED DEFAULT NULL,
  `tax` int(10) UNSIGNED DEFAULT NULL,
  `tax_type` enum('inclusive','exclusive') NOT NULL,
  `enable_stock` tinyint(1) NOT NULL DEFAULT 0,
  `alert_quantity` decimal(22,4) DEFAULT NULL,
  `sku` varchar(191) NOT NULL,
  `barcode_type` enum('C39','C128','EAN13','EAN8','UPCA','UPCE') DEFAULT 'C128',
  `expiry_period` decimal(4,2) DEFAULT NULL,
  `expiry_period_type` enum('days','months') DEFAULT NULL,
  `enable_sr_no` tinyint(1) NOT NULL DEFAULT 0,
  `weight` varchar(191) DEFAULT NULL,
  `product_custom_field1` varchar(191) DEFAULT NULL,
  `product_custom_field2` varchar(191) DEFAULT NULL,
  `product_custom_field3` varchar(191) DEFAULT NULL,
  `product_custom_field4` varchar(191) DEFAULT NULL,
  `product_custom_field5` varchar(191) DEFAULT NULL,
  `product_custom_field6` varchar(191) DEFAULT NULL,
  `product_custom_field7` varchar(191) DEFAULT NULL,
  `product_custom_field8` varchar(191) DEFAULT NULL,
  `product_custom_field9` varchar(191) DEFAULT NULL,
  `product_custom_field10` varchar(191) DEFAULT NULL,
  `product_custom_field11` varchar(191) DEFAULT NULL,
  `product_custom_field12` varchar(191) DEFAULT NULL,
  `product_custom_field13` varchar(191) DEFAULT NULL,
  `product_custom_field14` varchar(191) DEFAULT NULL,
  `product_custom_field15` varchar(191) DEFAULT NULL,
  `product_custom_field16` varchar(191) DEFAULT NULL,
  `product_custom_field17` varchar(191) DEFAULT NULL,
  `product_custom_field18` varchar(191) DEFAULT NULL,
  `product_custom_field19` varchar(191) DEFAULT NULL,
  `product_custom_field20` varchar(191) DEFAULT NULL,
  `image` varchar(191) DEFAULT NULL,
  `woocommerce_media_id` int(11) DEFAULT NULL,
  `product_description` text DEFAULT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `woocommerce_product_id` int(11) DEFAULT NULL,
  `woocommerce_disable_sync` tinyint(1) NOT NULL DEFAULT 0,
  `preparation_time_in_minutes` int(11) DEFAULT NULL,
  `warranty_id` int(11) DEFAULT NULL,
  `is_inactive` tinyint(1) NOT NULL DEFAULT 0,
  `not_for_selling` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `products`
--

INSERT INTO `products` (`id`, `name`, `business_id`, `type`, `unit_id`, `secondary_unit_id`, `sub_unit_ids`, `brand_id`, `category_id`, `sub_category_id`, `tax`, `tax_type`, `enable_stock`, `alert_quantity`, `sku`, `barcode_type`, `expiry_period`, `expiry_period_type`, `enable_sr_no`, `weight`, `product_custom_field1`, `product_custom_field2`, `product_custom_field3`, `product_custom_field4`, `product_custom_field5`, `product_custom_field6`, `product_custom_field7`, `product_custom_field8`, `product_custom_field9`, `product_custom_field10`, `product_custom_field11`, `product_custom_field12`, `product_custom_field13`, `product_custom_field14`, `product_custom_field15`, `product_custom_field16`, `product_custom_field17`, `product_custom_field18`, `product_custom_field19`, `product_custom_field20`, `image`, `woocommerce_media_id`, `product_description`, `created_by`, `woocommerce_product_id`, `woocommerce_disable_sync`, `preparation_time_in_minutes`, `warranty_id`, `is_inactive`, `not_for_selling`, `created_at`, `updated_at`) VALUES
(4, 'Short print modal soft', 1, 'variable', 1, NULL, NULL, 2, 4, NULL, NULL, 'exclusive', 1, NULL, '0004', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763245415_5f5vqoch-hcf9f3b4mths.png', NULL, NULL, 1, 15, 0, NULL, NULL, 0, 0, '2025-11-15 19:23:35', '2025-12-27 22:41:23'),
(5, 'Musculosa dorado piedras', 1, 'variable', 1, NULL, NULL, 2, 9, NULL, NULL, 'exclusive', 1, NULL, '0005', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763245569_efiz89h1nytt24qny8fsy.png', NULL, NULL, 1, 17, 0, NULL, NULL, 0, 0, '2025-11-15 19:26:09', '2025-12-27 22:41:23'),
(6, 'Musculosa Morley con cierre', 1, 'variable', 1, NULL, NULL, 2, 9, NULL, NULL, 'exclusive', 1, NULL, '0006', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1763245720_1757013795483-54196.png', NULL, NULL, 1, 19, 0, NULL, NULL, 0, 0, '2025-11-15 19:28:40', '2025-12-27 22:41:23'),
(7, 'Musculosa de morley rock', 1, 'single', 1, NULL, NULL, 2, 9, NULL, NULL, 'exclusive', 1, NULL, '0007', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1763245879_hc3fhndqdq0pulyodmccz.png', NULL, NULL, 1, 21, 0, NULL, NULL, 0, 0, '2025-11-15 19:31:19', '2025-12-27 22:41:23'),
(8, 'Musculosa Morley estampado', 1, 'single', 1, NULL, NULL, 2, 9, NULL, NULL, 'exclusive', 1, NULL, '0008', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763245997_zxpvph6vdjqrnqphrc1uv.png', 38093, NULL, 1, 23, 0, NULL, NULL, 0, 0, '2025-11-15 19:33:17', '2026-01-03 18:56:14'),
(9, 'Buzo chomba rústico rayado', 1, 'variable', 1, NULL, NULL, 2, 3, NULL, NULL, 'exclusive', 1, NULL, '0009', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1763246200_1759172502870-2460.png', 38094, NULL, 1, 25, 0, NULL, NULL, 0, 0, '2025-11-15 19:36:40', '2026-01-03 18:56:14'),
(10, 'Conjunto Palazzo y Remeron Rayas Anchas', 1, 'variable', 1, NULL, NULL, 2, 8, NULL, NULL, 'exclusive', 1, NULL, '0010', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763246302_1761837633192-19815.png', NULL, NULL, 1, 28, 0, NULL, NULL, 0, 0, '2025-11-15 19:38:22', '2025-12-27 22:41:23'),
(11, 'Conjunto bambula', 1, 'variable', 1, NULL, NULL, 2, 8, NULL, NULL, 'exclusive', 1, NULL, '0011', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763246435_ek27cf2ycczc7yyjkbr26.png', NULL, NULL, 1, 30, 0, NULL, NULL, 0, 0, '2025-11-15 19:40:35', '2025-12-27 22:41:23'),
(13, 'Conjunto Short y Puperon Rayado Finito', 1, 'variable', 1, NULL, NULL, 2, 8, NULL, NULL, 'exclusive', 1, NULL, '0013', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763247739_1761839195970-26216.png', 38095, NULL, 1, 32, 0, NULL, NULL, 0, 0, '2025-11-15 20:02:19', '2026-01-03 18:56:14'),
(14, 'Remera bordada frente', 1, 'single', 1, NULL, NULL, 2, 1, NULL, NULL, 'exclusive', 1, NULL, '0014', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763247795_1743076395658-69406.png', NULL, NULL, 1, 34, 0, NULL, NULL, 0, 0, '2025-11-15 20:03:15', '2025-12-27 22:41:23'),
(15, 'Puperon rock nevado', 1, 'single', 1, NULL, NULL, 2, 6, NULL, NULL, 'exclusive', 1, NULL, '0015', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763248702_q36ifqewu7b7f-royxuhj.png', NULL, NULL, 1, 36, 0, NULL, NULL, 0, 0, '2025-11-15 20:18:22', '2025-12-27 22:41:23'),
(16, 'Puperon Sonrie', 1, 'single', 1, NULL, NULL, 2, 6, NULL, NULL, 'exclusive', 1, NULL, '0016', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763249049_1758568668625-83638.png', NULL, NULL, 1, 38, 0, NULL, NULL, 0, 0, '2025-11-15 20:24:09', '2025-12-27 22:41:23'),
(18, 'Puperon Oakland', 1, 'variable', 1, NULL, NULL, 2, 6, NULL, NULL, 'exclusive', 1, NULL, '0018', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763249468_1758568712116-24640.png', NULL, NULL, 1, 40, 0, NULL, NULL, 0, 0, '2025-11-15 20:31:08', '2025-12-27 22:41:23'),
(19, 'Chomba pupera rayas finitas', 1, 'variable', 1, NULL, NULL, 2, 10, NULL, NULL, 'exclusive', 1, NULL, '0019', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763249637_dbfzkktfmcjop1gg8khba.png', NULL, NULL, 1, 42, 0, NULL, NULL, 0, 0, '2025-11-15 20:33:57', '2025-12-27 22:41:23'),
(20, 'Chomba pupera rayas anchas', 1, 'single', 1, NULL, NULL, 2, 10, NULL, NULL, 'exclusive', 1, NULL, '0020', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763249859_lkdjgmotlvpfujn51ya1.png', NULL, NULL, 1, 44, 0, NULL, NULL, 0, 0, '2025-11-15 20:37:39', '2025-12-27 22:41:23'),
(21, 'Puperon Liso', 1, 'variable', 1, NULL, NULL, 2, 6, NULL, NULL, 'exclusive', 1, NULL, '0021', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763253162_oeffduxl8yorr7fi8nrcc.png', NULL, NULL, 1, 46, 0, NULL, NULL, 0, 0, '2025-11-15 21:32:42', '2025-12-27 22:41:23'),
(22, 'Puperon liso morley nuevo', 1, 'variable', 1, NULL, NULL, 2, 6, NULL, NULL, 'exclusive', 1, NULL, '0022', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763254466_1761664976309-79262.png', NULL, NULL, 1, 48, 0, NULL, NULL, 0, 0, '2025-11-15 21:54:26', '2025-12-27 22:41:23'),
(23, 'Puperon Morley nevado', 1, 'variable', 1, NULL, NULL, 2, 6, NULL, NULL, 'exclusive', 1, NULL, '0023', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763254567_uknr91nzntg2m3aenkpgb.png', NULL, NULL, 1, 50, 0, NULL, NULL, 0, 0, '2025-11-15 21:56:07', '2025-12-27 22:41:23'),
(24, 'Remera Manga princesa boca beso', 1, 'variable', 1, NULL, NULL, 2, 1, NULL, NULL, 'exclusive', 1, NULL, '0024', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763254862_et0jk-ddfwqqlndexhpic.png', NULL, NULL, 1, 52, 0, NULL, NULL, 0, 0, '2025-11-15 22:01:02', '2025-12-27 22:41:23'),
(25, 'Remera sublimada', 1, 'variable', 1, NULL, NULL, 2, 1, NULL, NULL, 'exclusive', 1, NULL, '0025', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763254942_4y9hx5j8h4ayde27pqbkn.png', NULL, NULL, 1, 54, 0, NULL, NULL, 0, 0, '2025-11-15 22:02:22', '2025-12-27 22:41:23'),
(26, 'Remera sublimada cuello V', 1, 'variable', 1, NULL, NULL, 2, 1, NULL, NULL, 'exclusive', 1, NULL, '0026', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763255012_h4okh2i-q6tx5e6jkjskq.png', NULL, NULL, 1, 56, 0, NULL, NULL, 0, 0, '2025-11-15 22:03:32', '2025-12-27 22:41:23'),
(27, 'Remera sublimada rayada estampada', 1, 'variable', 1, NULL, NULL, 2, 1, NULL, NULL, 'exclusive', 1, NULL, '0027', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763255079_utwtuqoq5gvzrbppdi2-r.png', NULL, NULL, 1, 58, 0, NULL, NULL, 0, 0, '2025-11-15 22:04:39', '2025-12-27 22:41:23'),
(28, 'Remera palmera luna estrellas', 1, 'variable', 1, NULL, NULL, 2, 1, NULL, NULL, 'exclusive', 1, NULL, '0028', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763255154_frpclz-w9pbl5qnxvjnmr.png', 60, NULL, 1, 61, 0, NULL, NULL, 0, 0, '2025-11-15 22:05:54', '2025-12-27 22:41:23'),
(29, 'Remera manga japonesa sublimada', 1, 'variable', 1, NULL, NULL, 2, 1, NULL, NULL, 'exclusive', 1, NULL, '0029', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763255214_heybpbidksjhdw5m-3mc7.png', 62, NULL, 1, 63, 0, NULL, NULL, 0, 0, '2025-11-15 22:06:54', '2025-12-27 22:41:23'),
(30, 'Remera basica morley', 1, 'variable', 1, NULL, NULL, 2, 1, NULL, NULL, 'exclusive', 1, NULL, '0030', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763255439_1745258767089-76769.png', 64, NULL, 1, 65, 0, NULL, NULL, 0, 0, '2025-11-15 22:10:39', '2025-12-27 22:41:23'),
(31, 'Camisa Musso agujeros', 1, 'variable', 1, NULL, NULL, 4, 11, NULL, NULL, 'exclusive', 1, NULL, '0031', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763256989_cami-1-b377660094904d7c8217625158220108-1024-1024.webp', NULL, NULL, 1, 66, 0, NULL, NULL, 0, 0, '2025-11-15 22:36:29', '2025-12-27 22:41:23'),
(32, 'Conjunto texturas', 1, 'variable', 1, NULL, NULL, 4, 8, NULL, NULL, 'exclusive', 1, NULL, '0032', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763257050_img-3467-d725718e65c1090a1017622035419852-1024-1024.webp', NULL, NULL, 1, 67, 0, NULL, NULL, 0, 0, '2025-11-15 22:37:30', '2025-12-27 22:41:23'),
(33, 'Sudadera musculosa Lorenzo', 1, 'variable', 1, NULL, NULL, 4, 12, NULL, NULL, 'exclusive', 1, NULL, '0033', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763257141_lushka-man-8-67722837af349bfd6717550144584829-1024-1024.webp', NULL, NULL, 1, 68, 0, NULL, NULL, 0, 0, '2025-11-15 22:39:02', '2025-12-27 22:41:23'),
(34, 'Remera over boxy Vicente', 1, 'variable', 1, NULL, NULL, 4, 1, NULL, NULL, 'exclusive', 1, NULL, '0034', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763257254_vintage-3-c931a411debff6588917567313684519-1024-1024.webp', NULL, NULL, 1, 69, 0, NULL, NULL, 0, 0, '2025-11-15 22:40:54', '2025-12-27 22:41:23'),
(35, 'Remera bordada cordon texturas', 1, 'variable', 1, NULL, NULL, 4, 1, NULL, NULL, 'exclusive', 1, NULL, '0035', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763257325_bordada-2-886a37850550fa6ea717567317030099-1024-1024.webp', NULL, NULL, 1, 70, 0, NULL, NULL, 0, 0, '2025-11-15 22:42:05', '2025-12-27 22:41:23'),
(36, 'Remera Tokyo Jersey pesado rib tejido', 1, 'variable', 1, NULL, NULL, 4, 1, NULL, NULL, 'exclusive', 1, NULL, '0036', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763257414_reme-4-fce94c40381e5a3ddb17569043027615-1024-1024.webp', NULL, NULL, 1, 71, 0, NULL, NULL, 0, 0, '2025-11-15 22:43:34', '2025-12-27 22:41:23'),
(37, 'Remera boxy over Harry Jersey pesado', 1, 'variable', 1, NULL, NULL, 4, 1, NULL, NULL, 'exclusive', 1, NULL, '0037', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763257486_img-3057-c670b330f44c05a36717594512742648-1024-1024.webp', NULL, NULL, 1, 72, 0, NULL, NULL, 0, 0, '2025-11-15 22:44:46', '2025-12-27 22:41:23'),
(38, 'Remera Rocco roturas boxy fit', 1, 'variable', 1, NULL, NULL, 4, 1, NULL, NULL, 'exclusive', 1, NULL, '0038', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763257550_img-2227-fbbf862b3b8dedad3717628683085159-1024-1024.webp', NULL, NULL, 1, 73, 0, NULL, NULL, 0, 0, '2025-11-15 22:45:50', '2025-12-27 22:41:23'),
(39, 'Chomba tejida con cierre Philo', 1, 'variable', 1, NULL, NULL, 4, 10, NULL, NULL, 'exclusive', 1, NULL, '0039', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763257595_img-3694-0087da72f5b722110017631225544210-1024-1024.webp', NULL, NULL, 1, 74, 0, NULL, NULL, 0, 0, '2025-11-15 22:46:35', '2025-12-27 22:41:23'),
(40, 'Cinturon elastizado de fiesta con hebilla metálica', 1, 'variable', 1, NULL, NULL, 5, 13, NULL, NULL, 'exclusive', 1, NULL, '0040', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763999105_mg-4014-copia-1-1.webp', NULL, NULL, 1, 75, 0, NULL, NULL, 0, 0, '2025-11-24 12:45:05', '2025-12-27 22:41:23'),
(41, 'Cinturón elastizado de monedas importado', 1, 'variable', 1, NULL, NULL, 5, 13, NULL, NULL, 'exclusive', 1, NULL, '0041', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763999334_mg-3980-copia-2.webp', NULL, NULL, 1, 76, 0, NULL, NULL, 0, 0, '2025-11-24 12:48:54', '2025-12-27 22:41:23'),
(42, 'Cinturón de rafia con hebilla metálica importada', 1, 'variable', 1, NULL, NULL, 5, 13, NULL, NULL, 'exclusive', 1, NULL, '0042', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763999490_mg-3943-copia-1.webp', NULL, NULL, 1, 77, 0, NULL, NULL, 0, 0, '2025-11-24 12:51:30', '2025-12-27 22:41:23'),
(43, 'cinturón animal print importado', 1, 'single', 1, NULL, NULL, 5, 13, NULL, NULL, 'exclusive', 1, NULL, '0043', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763999559_mg-3924-copia-1.webp', NULL, NULL, 1, 78, 0, NULL, NULL, 0, 0, '2025-11-24 12:52:39', '2025-12-27 22:41:23'),
(44, 'Faja circular calada con chapones y ojales', 1, 'single', 1, NULL, NULL, 5, 13, NULL, NULL, 'exclusive', 1, NULL, '0044', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1763999997_mg-2552-copia-1.webp', NULL, NULL, 1, 79, 0, NULL, NULL, 0, 0, '2025-11-24 12:59:57', '2025-12-27 22:41:23'),
(45, 'Cinto caderin ovalo chico con tiras', 1, 'variable', 1, NULL, NULL, 5, 13, NULL, NULL, 'exclusive', 1, NULL, '0045', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764000374_dsc8917-2.webp', NULL, NULL, 1, 80, 0, NULL, NULL, 0, 0, '2025-11-24 13:06:14', '2025-12-27 22:41:23'),
(46, 'Cinto caderin circulitos y tiras', 1, 'single', 1, NULL, NULL, 5, 13, NULL, NULL, 'exclusive', 1, NULL, '0046', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764000468_dsc8878-copia-1.webp', NULL, NULL, 1, 81, 0, NULL, NULL, 0, 0, '2025-11-24 13:07:48', '2025-12-27 22:41:23'),
(47, 'Cinto media luna multitachas', 1, 'single', 1, NULL, NULL, 5, 13, NULL, NULL, 'exclusive', 1, NULL, '0047', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764000558_dsc7652-copia-1.webp', NULL, NULL, 1, 82, 0, NULL, NULL, 0, 0, '2025-11-24 13:09:18', '2025-12-27 22:41:23'),
(48, 'Cinto faja en punta animal print', 1, 'single', 1, NULL, NULL, 5, 13, NULL, NULL, 'exclusive', 1, NULL, '0048', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764000665_dsc7874-copia-photoroom-1.webp', NULL, NULL, 1, 83, 0, NULL, NULL, 0, 0, '2025-11-24 13:11:05', '2025-12-27 22:41:23'),
(49, 'Cinto de tachitas enlazadas importado', 1, 'single', 1, NULL, NULL, 5, 13, NULL, NULL, 'exclusive', 1, NULL, '0049', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764000767_dsc7434-copia-1.webp', NULL, NULL, 1, 84, 0, NULL, NULL, 0, 0, '2025-11-24 13:12:47', '2025-12-27 22:41:23'),
(50, 'Cinto elastizado de fiesta con dije lazo', 1, 'variable', 1, NULL, NULL, 5, 13, NULL, NULL, 'exclusive', 1, NULL, '0050', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764000924_iy-0-0005-dorado-1.webp', NULL, NULL, 1, 85, 0, NULL, NULL, 0, 0, '2025-11-24 13:15:24', '2025-12-27 22:41:23'),
(51, 'Cinturón importado con hebilla irregular', 1, 'variable', 1, NULL, NULL, 5, 13, NULL, NULL, 'exclusive', 1, NULL, '0051', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764002476_mg-3921-copia-1.webp', 865, NULL, 1, 86, 0, NULL, NULL, 0, 0, '2025-11-24 13:41:16', '2026-01-03 18:56:14'),
(52, 'Remera Mora', 1, 'variable', 1, NULL, NULL, 6, 1, NULL, NULL, 'exclusive', 1, NULL, '0052', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764003269_whatsapp-image-2025-11-15-at-11-12-52-am-1-36af533fbe1c1f295717635534968989-640-0.webp', NULL, NULL, 1, 87, 0, NULL, NULL, 0, 0, '2025-11-24 13:54:29', '2025-12-27 22:41:23'),
(53, 'Bambi Mora Estampada', 1, 'variable', 1, NULL, NULL, 6, 9, NULL, NULL, 'exclusive', 1, NULL, '0053', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764003389_whatsapp-image-2025-11-18-at-12-55-09-pm-12082df9517b423ed717634940199462-1024-1024.webp', NULL, NULL, 1, 88, 0, NULL, NULL, 0, 0, '2025-11-24 13:56:29', '2025-12-27 22:41:23'),
(54, 'Bambi clo Estampada', 1, 'single', 1, NULL, NULL, 6, 9, NULL, NULL, 'exclusive', 1, NULL, '0054', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764003590_whatsapp-image-2025-11-14-at-10-04-11-am-84a761e150720bd4eb17631258384604-480-0.webp', NULL, NULL, 1, 89, 0, NULL, NULL, 0, 0, '2025-11-24 13:59:50', '2025-12-27 22:41:23'),
(55, 'Remera Sky Estampada', 1, 'single', 1, NULL, NULL, 6, 9, NULL, NULL, 'exclusive', 1, NULL, '0055', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764003684_whatsapp-image-2025-10-03-at-10-33-17-am-72696f83356c60a24a17595056221068-480-0.webp', NULL, NULL, 1, 90, 0, NULL, NULL, 0, 0, '2025-11-24 14:01:24', '2025-12-27 22:41:23'),
(56, 'Remera Sky', 1, 'variable', 1, NULL, NULL, 6, 1, NULL, NULL, 'exclusive', 1, NULL, '0056', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764003883_whatsapp-image-2025-10-03-at-8-39-26-am-c5f73fbdbc5333411a17595044371096-640-0.webp', NULL, NULL, 1, 91, 0, NULL, NULL, 0, 0, '2025-11-24 14:04:43', '2025-12-27 22:41:23'),
(57, 'Remera Ali Sublimada', 1, 'single', 1, NULL, NULL, 6, 1, NULL, NULL, 'exclusive', 1, NULL, '0057', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764004275_whatsapp-image-2025-09-23-at-11-25-05-am-8f0d793e0b35a7c84517586418926976-1024-1024.webp', NULL, NULL, 1, 92, 0, NULL, NULL, 0, 0, '2025-11-24 14:11:15', '2025-12-27 22:41:23'),
(58, 'Remera nevada lisa', 1, 'single', 1, NULL, NULL, 6, 1, NULL, NULL, 'exclusive', 1, NULL, '0058', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764004313_whatsapp-image-2025-08-20-at-12-59-48-pm-c3794dbd1714d3d86317558679413836-640-0-4fd68fef6c0b33e27617577008909424-1024-1024.webp', NULL, NULL, 1, 93, 0, NULL, NULL, 0, 0, '2025-11-24 14:11:53', '2025-12-27 22:41:23'),
(59, 'Remera Mirta', 1, 'variable', 1, NULL, NULL, 6, 1, NULL, NULL, 'exclusive', 1, NULL, '0059', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764004557_whatsapp-image-2025-09-09-at-12-50-16-pm-7082a0043a6bf924af17574370578383-640-0.webp', NULL, NULL, 1, 94, 0, NULL, NULL, 0, 0, '2025-11-24 14:15:57', '2025-12-27 22:41:23'),
(60, 'Remera Spirit', 1, 'variable', 1, NULL, NULL, 6, 1, NULL, NULL, 'exclusive', 1, NULL, '0060', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764004659_whatsapp-image-2025-09-08-at-10-40-51-am-6f3fd2251843402dff17573426337510-480-0.webp', 37118, NULL, 1, 95, 0, NULL, NULL, 0, 0, '2025-11-24 14:17:39', '2026-01-03 18:56:14'),
(61, 'Bambi Lisa', 1, 'variable', 1, NULL, NULL, 6, 9, NULL, NULL, 'exclusive', 1, NULL, '0061', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764005094_whatsapp-image-2025-09-06-at-10-56-21-am-9d5e76d96230fbd8a117571712669751-1024-1024.webp', NULL, NULL, 1, 96, 0, NULL, NULL, 0, 0, '2025-11-24 14:24:54', '2025-12-27 22:41:23'),
(62, 'Remera Batik Brunch Club', 1, 'variable', 1, NULL, NULL, 6, 1, NULL, NULL, 'exclusive', 1, NULL, '0062', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764007456_whatsapp-image-2025-08-28-at-10-53-08-am-5d3515d41788b2c52817563939890042-640-0.webp', NULL, NULL, 1, 97, 0, NULL, NULL, 0, 0, '2025-11-24 15:04:16', '2025-12-27 22:41:23'),
(63, 'Short Wanda Sublimado', 1, 'single', 1, NULL, NULL, 6, 4, NULL, NULL, 'exclusive', 1, NULL, '0063', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764007548_whatsapp-image-2025-11-21-at-8-45-34-am-1-0efe49990e24f98a4817637457970720-1024-1024.webp', NULL, NULL, 1, 98, 0, NULL, NULL, 0, 0, '2025-11-24 15:05:48', '2025-12-27 22:41:23'),
(64, 'Muscu Leyla Sublimado', 1, 'single', 1, NULL, NULL, 6, 9, NULL, NULL, 'exclusive', 1, NULL, '0064', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764007615_whatsapp-image-2025-11-20-at-12-03-06-pm-16188949f84e1bcdd217636542539049-1024-1024.webp', NULL, NULL, 1, 99, 0, NULL, NULL, 0, 0, '2025-11-24 15:06:55', '2025-12-27 22:41:23'),
(65, 'Musculosa Gigi Vintage', 1, 'variable', 1, NULL, NULL, 6, 9, NULL, NULL, 'exclusive', 1, NULL, '0065', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764007763_whatsapp-image-2025-11-20-at-4-16-16-pm-2-copia-c8e6f3ebed9be6093317637247195696-640-0.webp', NULL, NULL, 1, 100, 0, NULL, NULL, 0, 0, '2025-11-24 15:09:23', '2025-12-27 22:41:23'),
(66, 'Remerita Linda', 1, 'variable', 1, NULL, NULL, 6, 1, NULL, NULL, 'exclusive', 1, NULL, '0066', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764007961_whatsapp-image-2025-02-28-at-12-43-26-pm-277e3e30cdb68e20e917407586315617-640-0.webp', NULL, NULL, 1, 101, 0, NULL, NULL, 0, 0, '2025-11-24 15:12:41', '2025-12-27 22:41:23'),
(67, 'Camisa Cuerina Cropped', 1, 'variable', 1, NULL, NULL, 7, 11, NULL, NULL, 'exclusive', 1, NULL, '0067', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764010002_mg-8416-6cbafafff6732d7e4917398996742901-1024-1024.webp', NULL, NULL, 1, 102, 0, NULL, NULL, 0, 0, '2025-11-24 15:46:42', '2025-12-27 22:41:23'),
(68, 'Top sin manga lino', 1, 'variable', 1, NULL, NULL, 7, 14, NULL, NULL, 'exclusive', 1, NULL, '0068', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764010162_image00001-4315e0c026998d9ad417628750463414-1024-1024.webp', NULL, NULL, 1, 103, 0, NULL, NULL, 0, 0, '2025-11-24 15:49:22', '2025-12-27 22:41:23'),
(69, 'Short de lino', 1, 'variable', 1, NULL, NULL, 7, 4, NULL, NULL, 'exclusive', 1, NULL, '0069', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764010334_image00001-2-05cb8becef0381bed317629515816882-1024-1024.webp', 37147, NULL, 1, 104, 0, NULL, NULL, 0, 0, '2025-11-24 15:52:14', '2026-01-03 18:56:14'),
(70, 'Pollera de lino', 1, 'variable', 1, NULL, NULL, 7, 15, NULL, NULL, 'exclusive', 1, NULL, '0070', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764010566_mg-6155-1785d6c9d75d5b48e617285683960531-1024-1024.webp', NULL, NULL, 1, 105, 0, NULL, NULL, 0, 0, '2025-11-24 15:56:06', '2025-12-27 22:41:23'),
(71, 'Saco de lino manga corta', 1, 'variable', 1, NULL, NULL, 7, 17, NULL, NULL, 'exclusive', 1, NULL, '0071', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1764010763_20241017-111331-df1220c89b7689444117293381575602-1024-1024.webp', NULL, NULL, 1, 106, 0, NULL, NULL, 0, 0, '2025-11-24 15:59:23', '2025-12-27 22:41:23'),
(72, 'Remera manga corta de hilo', 1, 'variable', 1, NULL, NULL, 7, 1, NULL, NULL, 'exclusive', 1, NULL, '0072', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764011004_image00006-4-9ba9696e5a753ca92017587224711774-1024-1024.webp', NULL, NULL, 1, 107, 0, NULL, NULL, 0, 0, '2025-11-24 16:03:24', '2025-12-27 22:41:23'),
(73, 'Blazer crop', 1, 'variable', 1, NULL, NULL, 7, 18, NULL, NULL, 'exclusive', 1, NULL, '0073', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1764011287_mg-9473-3983b62a00986123f917609855822017-1024-1024.webp', 845, NULL, 1, 108, 0, NULL, NULL, 0, 0, '2025-11-24 16:08:07', '2026-01-03 18:56:14'),
(74, 'Saco sin manga cruzado lino', 1, 'variable', 1, NULL, NULL, 7, 17, NULL, NULL, 'exclusive', 1, NULL, '0074', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764011675_mg-9424-8c2c36c9fc3cc5231517610488850522-1024-1024.webp', NULL, NULL, 1, 109, 0, NULL, NULL, 0, 0, '2025-11-24 16:14:35', '2025-12-27 22:41:23'),
(75, 'Short pollera lino', 1, 'variable', 1, NULL, NULL, 7, 4, NULL, NULL, 'exclusive', 1, NULL, '0075', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764012098_mg-1315-716e5ad61dbc3d73c017564719379508-1024-1024.webp', NULL, NULL, 1, 110, 0, NULL, NULL, 0, 0, '2025-11-24 16:21:38', '2025-12-27 22:41:23'),
(76, 'Palazzos Fibrana Liso', 1, 'variable', 1, NULL, NULL, 8, 2, NULL, NULL, 'exclusive', 1, NULL, '0076', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764012360_1007369070-76239fad234df64edb17631332028473-1024-1024.webp', NULL, NULL, 1, 111, 0, NULL, NULL, 0, 0, '2025-11-24 16:26:00', '2025-12-27 22:41:23'),
(77, 'Palazzos Morley Ottamon Oscuro', 1, 'variable', 1, NULL, NULL, 8, 2, NULL, NULL, 'exclusive', 1, NULL, '0077', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764012553_1007416843-455fc020aa630db0c217637475565470-1024-1024.webp', 916, NULL, 1, 112, 0, NULL, NULL, 0, 0, '2025-11-24 16:29:13', '2026-01-03 18:56:14'),
(78, 'Remera (ALGODÓN) - Rosa Print - (Mujer)', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0078', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764012681_1007004043-6d8c11badc175e49ee17584232629607-1024-1024.webp', NULL, NULL, 1, 113, 0, NULL, NULL, 0, 0, '2025-11-24 16:31:21', '2025-12-27 22:41:23'),
(79, 'Remera (ALGODÓN) Sleeping Cat', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0079', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764012898_1006349507-2e5843dbcf2642df7517405869970785-1024-1024.webp', NULL, NULL, 1, 114, 0, NULL, NULL, 0, 0, '2025-11-24 16:34:58', '2025-12-27 22:41:23'),
(80, 'Remera (Dama) Flores 3D (Modal)', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0080', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764013042_img-20240124-wa0056-fe5261cb50e8bb57af17061236940735-1024-1024.webp', NULL, NULL, 1, 115, 0, NULL, NULL, 0, 0, '2025-11-24 16:37:22', '2025-12-27 22:41:23'),
(81, 'Remera DTF (ALGODÓN) Miles de Corazones', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0081', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764013220_remera-miles-de-corazones-e6292394168685de1017273736298835-1024-1024.webp', NULL, NULL, 1, 116, 0, NULL, NULL, 0, 0, '2025-11-24 16:40:20', '2025-12-27 22:41:23'),
(82, 'Remera (ALGODÓN) Los Angeles', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0082', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764013409_los-angeles-remera-negro-mujer-db0e1bfd1d1cb1b13617189893964911-1024-1024.webp', NULL, NULL, 1, 117, 0, NULL, NULL, 0, 0, '2025-11-24 16:43:29', '2025-12-27 22:41:23'),
(83, 'Remera (ALGODÓN) Corazon Rosa', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0083', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764013677_1000112567-d91a819da2bc96f06d17062332681293-1024-1024.webp', NULL, NULL, 1, 118, 0, NULL, NULL, 0, 0, '2025-11-24 16:47:57', '2025-12-27 22:41:23'),
(84, 'Remera (MODAL) Pink Mariposa', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0084', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764013803_1000986527-904eb9ac04e141e0ed17168365633734-1024-1024.webp', NULL, NULL, 1, 119, 0, NULL, NULL, 0, 0, '2025-11-24 16:50:03', '2025-12-27 22:41:23'),
(85, 'Remera DTF (ALGODÓN) Arcoíris Mariposa', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0085', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764013939_1007093317-12e358c3e3ec52bdb317597159196008-1024-1024.webp', NULL, NULL, 1, 120, 0, NULL, NULL, 0, 0, '2025-11-24 16:52:19', '2025-12-27 22:41:23'),
(86, 'Remera DTF (ALGODÓN) Corazones Cafe', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0086', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764014073_7dce3aa3a0a34c7f82e006adbb36c51d-8ac755955e44bbcf7617492593435262-1024-1024.webp', NULL, NULL, 1, 121, 0, NULL, NULL, 0, 0, '2025-11-24 16:54:33', '2025-12-27 22:41:23'),
(87, 'Remera (MODAL) Flor Marron', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0087', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764014173_flor-marron-db27fe7ab5e7cdf99f17080308677759-1024-1024.webp', NULL, NULL, 1, 122, 0, NULL, NULL, 0, 0, '2025-11-24 16:56:13', '2025-12-27 22:41:23'),
(88, 'Remera (Modal) Fly To You', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0088', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764014284_fly-to-you1-86d7b788143df0d58416675751337964-1024-1024.webp', NULL, NULL, 1, 123, 0, NULL, NULL, 0, 0, '2025-11-24 16:58:04', '2025-12-27 22:41:23'),
(89, 'Remera (ALGODÓN) Símbolo HP', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0089', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764014418_simbolo-hp-alg-9a0021f74c78e706b217347260325473-1024-1024.webp', NULL, NULL, 1, 124, 0, NULL, NULL, 0, 0, '2025-11-24 17:00:18', '2025-12-27 22:41:23'),
(90, 'Remeras (Modal) Diseño Nuevo', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0090', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764014555_img-20230714-wa01601-2202c9aa0c1e71a69c16901456620982-1024-1024.webp', NULL, NULL, 1, 125, 0, NULL, NULL, 0, 0, '2025-11-24 17:02:35', '2025-12-27 22:41:23'),
(91, 'Remera (Modal) Conejo', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0091', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764014772_whatsapp-image-2023-10-17-at-12-06-11-1-66374c9c34e681f46e16975732887842-1024-1024.webp', NULL, NULL, 1, 126, 0, NULL, NULL, 0, 0, '2025-11-24 17:06:12', '2025-12-27 22:41:23'),
(92, 'Remera DTF (ALGODÓN) 5 Corazones', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0092', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764014981_remera-5-corazones-ba15241e8928ea284c17273730220570-1024-1024.webp', NULL, NULL, 1, 127, 0, NULL, NULL, 0, 0, '2025-11-24 17:09:41', '2025-12-27 22:41:23'),
(93, 'Remera DTF (ALGODÓN) Corazón Leopardo', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0093', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764015206_remera-corazon-leopardo-004654d9cd8315440917247000028616-1024-1024.webp', NULL, NULL, 1, 128, 0, NULL, NULL, 0, 0, '2025-11-24 17:13:26', '2025-12-27 22:41:23'),
(94, 'Remera (MODAL) Otoño Mariposa', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0094', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764015448_0776d898f4a6c9f9f4283d3048e6803c-cbf48cd5ff619be64e17151763227926-1024-1024.webp', NULL, NULL, 1, 129, 0, NULL, NULL, 0, 0, '2025-11-24 17:17:28', '2025-12-27 22:41:23'),
(95, 'Remera (ALGODÓN) Guess', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0095', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764015596_guess-21-3bc3c21bd684d56f8316684343028310-1024-1024.webp', NULL, NULL, 1, 130, 0, NULL, NULL, 0, 0, '2025-11-24 17:19:56', '2025-12-27 22:41:23'),
(96, 'Remera (MODAL) Mariposas volando de corazón', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0096', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1764016074_whatsapp-image-2024-02-15-at-17-25-34-71cfebf93929e4220617080306509395-1024-1024.webp', NULL, NULL, 1, 131, 0, NULL, NULL, 0, 0, '2025-11-24 17:27:54', '2025-12-27 22:41:23'),
(97, 'Remera (Modal)Torre de Flores', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0097', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764016176_03dd39d32308c6945792802f86fbcea51-d18edbd6a2b884afc816943170888490-1024-1024.webp', NULL, NULL, 1, 132, 0, NULL, NULL, 0, 0, '2025-11-24 17:29:36', '2025-12-27 22:41:23'),
(98, 'Remera (Modal) Poni', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0098', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764016288_whatsapp-image-2023-03-07-at-13-04-241-6a48f60299d8df46cb16782053315583-1024-1024.webp', NULL, NULL, 1, 133, 0, NULL, NULL, 0, 0, '2025-11-24 17:31:28', '2025-12-27 22:41:23'),
(99, 'Remera (MODAL) 3 corazones', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0099', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764016405_imagen-de-whatsapp-2023-12-06-a-las-10-20-30-eddea7d5-0c60e2dbdbc5a31fbb17018692096940-1024-1024.webp', NULL, NULL, 1, 134, 0, NULL, NULL, 0, 0, '2025-11-24 17:33:25', '2025-12-27 22:41:23'),
(100, 'Remera (ALGODÓN) Meow', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0100', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764017239_meow-74116b6e153daea75517006847167079-1024-1024.webp', NULL, NULL, 1, 135, 0, NULL, NULL, 0, 0, '2025-11-24 17:47:19', '2025-12-27 22:41:23'),
(101, 'Remera (MODAL) Corazon leopardo', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0101', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764017410_corazon-leopardo-ad4df429d73993915c17005994384325-1024-1024.webp', NULL, NULL, 1, 136, 0, NULL, NULL, 0, 0, '2025-11-24 17:50:10', '2025-12-27 22:41:23'),
(102, 'Remera (Modal) Mariposa Salmon', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0102', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764017534_whatsapp-image-2023-10-26-at-12-14-04-c0cdd74b8a49ee216416983449931504-1024-1024.webp', NULL, NULL, 1, 137, 0, NULL, NULL, 0, 0, '2025-11-24 17:52:14', '2025-12-27 22:41:23'),
(103, 'Remera (ALGODON) Perfectly imperfectly', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0103', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764017651_whatsapp-image-2023-06-30-at-16-20-4111-97356924e4dd34b7c416881534739283-1024-1024.webp', NULL, NULL, 1, 138, 0, NULL, NULL, 0, 0, '2025-11-24 17:54:11', '2025-12-27 22:41:23'),
(104, 'Remeras (Modal) Muchos corazones', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0104', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764017772_muchos-corazones1-04f70614cdfd14360e16940362902284-1024-1024.webp', NULL, NULL, 1, 139, 0, NULL, NULL, 0, 0, '2025-11-24 17:56:12', '2025-12-27 22:41:23'),
(105, 'Remera (MODAL) Shut the fuck up', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0105', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764017930_whatsapp-image-2024-01-22-at-12-52-04-0185d0cbd7547b30c817059408717052-1024-1024.webp', NULL, NULL, 1, 140, 0, NULL, NULL, 0, 0, '2025-11-24 17:58:50', '2025-12-27 22:41:24'),
(106, 'Remera (ALGODÓN) LISO', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0106', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764018070_lisa1-7562323bbf9491bc1f16684343894523-1024-1024.webp', NULL, NULL, 1, 306, 0, NULL, NULL, 0, 0, '2025-11-24 18:01:10', '2025-12-27 22:47:40'),
(107, 'Remera (Modal) Ramo de flores', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0107', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1764018244_ramo-de-flores1-3044e714a2390f235916699882880701-1024-1024.webp', NULL, NULL, 1, 307, 0, NULL, NULL, 0, 0, '2025-11-24 18:04:04', '2025-12-27 22:47:40'),
(108, 'Remera (ALGODÓN) Corazon 2', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0108', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764018449_corazon-2-21-8df8ec48b53b50159216684352890974-1024-1024.webp', NULL, NULL, 1, 308, 0, NULL, NULL, 0, 0, '2025-11-24 18:07:29', '2025-12-27 22:47:40'),
(109, 'Remera (ALGODÓN) Vans', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0109', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764018601_vans-7bd2a6ad6e16d2045e17008310590543-1024-1024.webp', NULL, NULL, 1, 309, 0, NULL, NULL, 0, 0, '2025-11-24 18:10:01', '2025-12-27 22:47:40'),
(110, 'Remera (MODAL) Miles de corazones', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0110', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764018973_whatsapp-image-2024-02-12-at-13-19-54-f3ddd78248039c5d5917077596782857-1024-1024.webp', NULL, NULL, 1, 310, 0, NULL, NULL, 0, 0, '2025-11-24 18:16:13', '2025-12-27 22:47:40'),
(111, 'Remera (ALGODÓN) Inspire', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0111', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764019079_inspire1-63bfbd0019e2050c3816684342285173-1024-1024.webp', NULL, NULL, 1, 311, 0, NULL, NULL, 0, 0, '2025-11-24 18:17:59', '2025-12-27 22:47:40'),
(112, 'Remera (Modal) CORAZON 3', 1, 'variable', 1, NULL, NULL, 8, NULL, NULL, NULL, 'exclusive', 1, NULL, '0112', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764019184_img-20221123-151613-2191-866eee24d280ae4d8c16801724486525-1024-1024.webp', NULL, NULL, 1, 312, 0, NULL, NULL, 0, 0, '2025-11-24 18:19:44', '2025-12-27 22:47:40'),
(113, 'Remera (Modal) Triple corazón', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0113', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764019461_01-abe8cdad8b7e55a85616975731004078-1024-1024.webp', NULL, NULL, 1, 313, 0, NULL, NULL, 0, 0, '2025-11-24 18:24:21', '2025-12-27 22:47:40'),
(114, 'Remera (Modal) Primavera', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0114', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764021718_img-20230913-wa03981-aad7c9c25d6cd5b92416953912918734-1024-1024.webp', NULL, NULL, 1, 314, 0, NULL, NULL, 0, 0, '2025-11-24 19:01:58', '2025-12-27 22:47:40'),
(115, 'Remera (Modal) butterfly', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0115', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764021821_001-4780622bb3fa8890e316975734227796-1024-1024.webp', NULL, NULL, 1, 315, 0, NULL, NULL, 0, 0, '2025-11-24 19:03:42', '2025-12-27 22:47:40'),
(116, 'Remera (Modal) M', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0116', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764021907_m1-12619e44b88a9f06f516686502301240-1024-1024.webp', NULL, NULL, 1, 316, 0, NULL, NULL, 0, 0, '2025-11-24 19:05:07', '2025-12-27 22:47:40'),
(117, 'Olivos - Baggy desflecado oxido', 1, 'variable', 1, NULL, NULL, 9, 2, NULL, NULL, 'exclusive', 1, NULL, '0117', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764022624_ccj6-72606a0b5376aa78fc17471602575350-480-0.webp', NULL, NULL, 1, 317, 0, NULL, NULL, 0, 0, '2025-11-24 19:17:04', '2025-12-27 22:47:40'),
(118, 'Balcarce - Baggy 4 bolsillos oxido con bordado', 1, 'variable', 1, NULL, NULL, 9, 2, NULL, NULL, 'exclusive', 1, NULL, '0118', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764022825_ccj3-f50dafa413208862df17617528358089-640-0.webp', NULL, NULL, 1, 318, 0, NULL, NULL, 0, 0, '2025-11-24 19:20:25', '2025-12-27 22:47:40'),
(119, 'San Pedro - Baggy con recortes desflecados', 1, 'variable', 1, NULL, NULL, 9, 2, NULL, NULL, 'exclusive', 1, NULL, '0119', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764023010_ccj62-e9a92f0bbc0a95771f17532031501606-1024-1024.webp', NULL, NULL, 1, 319, 0, NULL, NULL, 0, 0, '2025-11-24 19:23:30', '2025-12-27 22:47:40'),
(120, 'San Pablo - Baggy desflecado gris loc', 1, 'variable', 1, NULL, NULL, 9, 2, NULL, NULL, 'exclusive', 1, NULL, '0120', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764023165_ccj17-da27c0a9888c793b8517537271609507-640-0.webp', NULL, NULL, 1, 320, 0, NULL, NULL, 0, 0, '2025-11-24 19:26:05', '2025-12-27 22:47:40'),
(121, 'Cafayate - Baggy desflecado jean nevado', 1, 'variable', 1, NULL, NULL, 9, 2, NULL, NULL, 'exclusive', 1, NULL, '0121', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764023326_ccj9-04150e73e94284522e17561522360449-1024-1024.webp', NULL, NULL, 1, 321, 0, NULL, NULL, 0, 0, '2025-11-24 19:28:46', '2025-12-27 22:47:40'),
(122, 'Bariloche - Baggy 4 bolsillos con recortes', 1, 'variable', 1, NULL, NULL, 9, 2, NULL, NULL, 'exclusive', 1, NULL, '0122', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764023527_ccj9-ac677583e8051fa9dd17551858391962-1024-1024.webp', NULL, NULL, 1, 322, 0, NULL, NULL, 0, 0, '2025-11-24 19:32:07', '2025-12-27 22:47:40'),
(123, 'San Lorenzo - Baggy desflecado gris localizado', 1, 'variable', 1, NULL, NULL, 9, 2, NULL, NULL, 'exclusive', 1, NULL, '0123', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764025233_ccj8-fc07e46c345e87378917464652523087-640-0.webp', NULL, NULL, 1, 323, 0, NULL, NULL, 0, 0, '2025-11-24 20:00:33', '2025-12-27 22:47:40');
INSERT INTO `products` (`id`, `name`, `business_id`, `type`, `unit_id`, `secondary_unit_id`, `sub_unit_ids`, `brand_id`, `category_id`, `sub_category_id`, `tax`, `tax_type`, `enable_stock`, `alert_quantity`, `sku`, `barcode_type`, `expiry_period`, `expiry_period_type`, `enable_sr_no`, `weight`, `product_custom_field1`, `product_custom_field2`, `product_custom_field3`, `product_custom_field4`, `product_custom_field5`, `product_custom_field6`, `product_custom_field7`, `product_custom_field8`, `product_custom_field9`, `product_custom_field10`, `product_custom_field11`, `product_custom_field12`, `product_custom_field13`, `product_custom_field14`, `product_custom_field15`, `product_custom_field16`, `product_custom_field17`, `product_custom_field18`, `product_custom_field19`, `product_custom_field20`, `image`, `woocommerce_media_id`, `product_description`, `created_by`, `woocommerce_product_id`, `woocommerce_disable_sync`, `preparation_time_in_minutes`, `warranty_id`, `is_inactive`, `not_for_selling`, `created_at`, `updated_at`) VALUES
(124, 'Rivadavia - Baggy con tiras gris nev', 1, 'variable', 1, NULL, NULL, 9, 2, NULL, NULL, 'exclusive', 1, NULL, '0124', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764025425_ccj39-cb4e73807a877584eb17633997608184-1024-1024.webp', NULL, NULL, 1, 324, 0, NULL, NULL, 0, 0, '2025-11-24 20:03:45', '2025-12-27 22:47:40'),
(125, 'Palermo - Baggy celeste desflecado vainilla', 1, 'variable', 1, NULL, NULL, 9, 2, NULL, NULL, 'exclusive', 1, NULL, '0125', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764025597_ccj3-aa3abd85807f5e3f9617561523596674-1024-1024.webp', NULL, NULL, 1, 325, 0, NULL, NULL, 0, 0, '2025-11-24 20:06:37', '2025-12-27 22:47:40'),
(126, 'Puerto Madryn - Bermuda desflecada con rotura', 1, 'variable', 1, NULL, NULL, 9, 2, NULL, NULL, 'exclusive', 1, NULL, '0126', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764025760_ccj21-a1b9c7f171b075a62617568358968482-640-0.webp', NULL, NULL, 1, 326, 0, NULL, NULL, 0, 0, '2025-11-24 20:09:20', '2025-12-27 22:47:40'),
(127, 'Catamarca - Bermuda con rotura jean', 1, 'variable', 1, NULL, NULL, 9, 2, NULL, NULL, 'exclusive', 1, NULL, '0127', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764025913_ccj3-89978daee37a503ea217568358113649-640-0.webp', NULL, NULL, 1, 327, 0, NULL, NULL, 0, 0, '2025-11-24 20:11:53', '2025-12-27 22:47:40'),
(128, 'La Plata - Bermuda baggy estampada', 1, 'variable', 1, NULL, NULL, 9, 2, NULL, NULL, 'exclusive', 1, NULL, '0128', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764026102_ccj2-5c049738490cbe666017561538580970-1024-1024.webp', NULL, NULL, 1, 328, 0, NULL, NULL, 0, 0, '2025-11-24 20:15:02', '2025-12-27 22:47:40'),
(129, 'Ezeiza - Bermuda carpintera estampada', 1, 'variable', 1, NULL, NULL, 9, 2, NULL, NULL, 'exclusive', 1, NULL, '0129', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764026284_ccj62-7359654cc7296ed0d117633996830716-640-0.webp', NULL, NULL, 1, 329, 0, NULL, NULL, 0, 0, '2025-11-24 20:18:04', '2025-12-27 22:47:40'),
(130, 'Chaco - Bermuda baggy cargo con recorte', 1, 'variable', 1, NULL, NULL, 9, 2, NULL, NULL, 'exclusive', 1, NULL, '0130', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764026454_ccj60-95495e3ba144c70d4e17561539175295-640-0.webp', NULL, NULL, 1, 330, 0, NULL, NULL, 0, 0, '2025-11-24 20:20:54', '2025-12-27 22:47:40'),
(131, 'San Telmo - Bermuda baggy cargo con recorte', 1, 'variable', 1, NULL, NULL, 9, 2, NULL, NULL, 'exclusive', 1, NULL, '0131', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764026616_ccj30-a36afd8bf612120ceb17568356884254-1024-1024.webp', NULL, NULL, 1, 331, 0, NULL, NULL, 0, 0, '2025-11-24 20:23:36', '2025-12-27 22:47:40'),
(132, 'Campera BUNBY c lentejuelas', 1, 'variable', 1, NULL, NULL, 10, 19, NULL, NULL, 'exclusive', 1, NULL, '0132', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764027026_whatsapp-image-2025-09-01-at-13-06-29-a325c7c82052635a8a17567472332161-1024-1024.webp', NULL, NULL, 1, 332, 0, NULL, NULL, 0, 0, '2025-11-24 20:30:26', '2025-12-27 22:47:40'),
(133, 'Chaqueta BRIE gabardina print', 1, 'variable', 1, NULL, NULL, 10, 19, NULL, NULL, 'exclusive', 1, NULL, '0133', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764027167_whatsapp-image-2025-05-12-at-08-50-39-da8d5403f27d3a6a7b17470513661057-1024-1024.webp', NULL, NULL, 1, 333, 0, NULL, NULL, 0, 0, '2025-11-24 20:32:47', '2025-12-27 22:47:40'),
(134, 'Conjunto ACHEROTIA Lino c bordado', 1, 'variable', 1, NULL, NULL, 10, 8, NULL, NULL, 'exclusive', 1, NULL, '0134', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764027413_img-3918-b948858803e95428bb17597775877938-1024-1024.webp', NULL, NULL, 1, 334, 0, NULL, NULL, 0, 0, '2025-11-24 20:36:53', '2025-12-27 22:47:40'),
(135, 'Musculosa DORMOUNT c canutillo', 1, 'variable', 1, NULL, NULL, 10, 9, NULL, NULL, 'exclusive', 1, NULL, '0135', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764027616_whatsapp-image-2025-09-11-at-09-37-02-833212aa16419a29af17576046074533-1024-1024.webp', NULL, NULL, 1, 335, 0, NULL, NULL, 0, 0, '2025-11-24 20:40:16', '2025-12-27 22:47:40'),
(136, 'Top Hegel un hombro c/ lentejuelas', 1, 'variable', 1, NULL, NULL, 10, 14, NULL, NULL, 'exclusive', 1, NULL, '0136', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764027923_whatsapp-image-2025-11-05-at-13-38-56-2670652ece66eac29f17623617907781-1024-1024.webp', NULL, NULL, 1, 336, 0, NULL, NULL, 0, 0, '2025-11-24 20:45:23', '2025-12-27 22:47:40'),
(138, 'Top GELLERT', 1, 'variable', 1, NULL, NULL, 10, 14, NULL, NULL, 'exclusive', 1, NULL, '0138', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764028134_whatsapp-image-2024-10-21-at-14-16-44-1e0f198f66b912d4aa17295318257190-1024-1024.webp', NULL, NULL, 1, 337, 0, NULL, NULL, 0, 0, '2025-11-24 20:48:54', '2025-12-27 22:47:40'),
(139, 'Musculosa NEPAL', 1, 'variable', 1, NULL, NULL, 10, 9, NULL, NULL, 'exclusive', 1, NULL, '0139', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764028260_whatsapp-image-2023-07-31-at-16-34-401-b664c91d79e3ae035216908932374079-1024-1024.webp', 886, NULL, 1, 338, 0, NULL, NULL, 0, 0, '2025-11-24 20:51:00', '2026-01-03 18:56:26'),
(140, 'Musculosa ADANA tull', 1, 'variable', 1, NULL, NULL, 10, 9, NULL, NULL, 'exclusive', 1, NULL, '0140', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764028493_whatsapp-image-2023-07-28-at-15-34-281-b7015ea893265799ba16906346450253-1024-1024.webp', 887, NULL, 1, 339, 0, NULL, NULL, 0, 0, '2025-11-24 20:54:53', '2026-01-03 18:56:26'),
(141, 'Musculosa SAMSUM', 1, 'variable', 1, NULL, NULL, 10, 9, NULL, NULL, 'exclusive', 1, NULL, '0141', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764028618_whatsapp-image-2023-07-28-at-15-10-521-dd821e079407ec3c2616905717615599-1024-1024.webp', NULL, NULL, 1, 340, 0, NULL, NULL, 0, 0, '2025-11-24 20:56:58', '2025-12-27 22:47:40'),
(142, 'Musculosa AQUILES bordada', 1, 'variable', 1, NULL, NULL, 10, 9, NULL, NULL, 'exclusive', 1, NULL, '0142', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764028751_whatsapp-image-2023-07-27-at-16-43-341-2fd80f6bbbc31e69cd16905512122889-1024-1024.webp', NULL, NULL, 1, 341, 0, NULL, NULL, 0, 0, '2025-11-24 20:59:11', '2025-12-27 22:47:40'),
(143, 'Remera MARIO c piedras', 1, 'variable', 1, NULL, NULL, 10, 1, NULL, NULL, 'exclusive', 1, NULL, '0143', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764028851_whatsapp-image-2025-04-08-at-09-04-29-1-b5a06c7edc89a18d2017441142829757-1024-1024.webp', NULL, NULL, 1, 342, 0, NULL, NULL, 0, 0, '2025-11-24 21:00:51', '2025-12-27 22:47:40'),
(144, 'Remera LIVIO gamuza elastisada con strass', 1, 'variable', 1, NULL, NULL, 10, 1, NULL, NULL, 'exclusive', 1, NULL, '0144', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764028979_captura-de-pantalla-2025-08-12-092705-59fc5525b993fc7d0a17550016713040-1024-1024.webp', 37031, NULL, 1, 343, 0, NULL, NULL, 0, 0, '2025-11-24 21:02:59', '2026-01-03 18:56:26'),
(145, 'Musculosa HYMAN c piedras', 1, 'variable', 1, NULL, NULL, 10, 9, NULL, NULL, 'exclusive', 1, NULL, '0145', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764029087_whatsapp-image-2025-10-16-at-15-47-16-1-ec1fbe240cee004f6817607055392705-1024-1024.webp', NULL, NULL, 1, 344, 0, NULL, NULL, 0, 0, '2025-11-24 21:04:47', '2025-12-27 22:47:40'),
(146, 'Remera Basher', 1, 'variable', 1, NULL, NULL, 10, 1, NULL, NULL, 'exclusive', 1, NULL, '0146', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764118186_55-m4a3795-d6f99fddcf56f148d917428375536595-1024-1024.webp', NULL, NULL, 1, 345, 0, NULL, NULL, 0, 0, '2025-11-25 21:49:46', '2025-12-27 22:47:40'),
(147, 'Remera TUMHAS', 1, 'variable', 1, NULL, NULL, 10, 1, NULL, NULL, 'exclusive', 1, NULL, '0147', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764118397_whatsapp-image-2025-07-16-at-11-34-19-2-20a0edf3b75e4407c817526789830080-1024-1024.webp', NULL, NULL, 1, 346, 0, NULL, NULL, 0, 0, '2025-11-25 21:53:17', '2025-12-27 22:47:40'),
(148, 'Remera MEFISTO', 1, 'variable', 1, NULL, NULL, 10, 1, NULL, NULL, 'exclusive', 1, NULL, '0148', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764118602_whatsapp-image-2025-07-23-at-15-40-19-c20b5418c6456f3ab717532971022300-1024-1024.webp', 37073, NULL, 1, 347, 0, NULL, NULL, 0, 0, '2025-11-25 21:56:42', '2026-01-03 18:56:26'),
(149, 'Remera CHAMUEL', 1, 'variable', 1, NULL, NULL, 10, 1, NULL, NULL, 'exclusive', 1, NULL, '0149', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764118724_whatsapp-image-2025-07-31-at-10-03-37-1-e0cfd686c08d1d416717539670711831-1024-1024.webp', NULL, NULL, 1, 348, 0, NULL, NULL, 0, 0, '2025-11-25 21:58:44', '2025-12-27 22:47:40'),
(150, 'Remera AGARES', 1, 'variable', 1, NULL, NULL, 10, 1, NULL, NULL, 'exclusive', 1, NULL, '0150', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764118875_whatsapp-image-2025-08-05-at-08-51-44-1-2a9544b2370118baaf17543954686453-1024-1024.webp', NULL, NULL, 1, 349, 0, NULL, NULL, 0, 0, '2025-11-25 22:01:15', '2025-12-27 22:47:40'),
(151, 'Remera LEVIAT', 1, 'variable', 1, NULL, NULL, 10, 1, NULL, NULL, 'exclusive', 1, NULL, '0151', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1766946689_whatsapp-image-2025-08-05-at-14-54-25-2-b2f202a9348a90518717544173034952-1024-1024.webp', 37150, NULL, 1, 350, 0, NULL, NULL, 0, 0, '2025-11-25 22:03:45', '2026-01-03 18:56:26'),
(152, 'Remera BROUN', 1, 'variable', 1, NULL, NULL, 10, 1, NULL, NULL, 'exclusive', 1, NULL, '0152', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764119161_whatsapp-image-2025-08-05-at-15-04-14-2-67299a1539d89ff9dc17544184833688-1024-1024.webp', NULL, NULL, 1, 351, 0, NULL, NULL, 0, 0, '2025-11-25 22:06:01', '2025-12-27 22:47:40'),
(153, 'Remera BARUCH c strass', 1, 'variable', 1, NULL, NULL, 10, 1, NULL, NULL, 'exclusive', 1, NULL, '0153', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764119264_whatsapp-image-2025-08-08-at-09-37-23-1-8c188559d120e6eff417546569295627-1024-1024.webp', NULL, NULL, 1, 352, 0, NULL, NULL, 0, 0, '2025-11-25 22:07:44', '2025-12-27 22:47:40'),
(154, 'Remera SARIEL lentejuelas', 1, 'variable', 1, NULL, NULL, 10, 1, NULL, NULL, 'exclusive', 1, NULL, '0154', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764119395_whatsapp-image-2025-08-08-at-10-57-00-9686f58f5176220f5d17546614939509-1024-1024.webp', NULL, NULL, 1, 353, 0, NULL, NULL, 0, 0, '2025-11-25 22:09:55', '2025-12-27 22:47:40'),
(155, 'Remera VALEFOR', 1, 'variable', 1, NULL, NULL, 10, 1, NULL, NULL, 'exclusive', 1, NULL, '0155', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764119587_whatsapp-image-2025-08-15-at-09-39-37-d9bd83d385fa513fe517552629166300-1024-1024.webp', NULL, NULL, 1, 354, 0, NULL, NULL, 0, 0, '2025-11-25 22:13:07', '2025-12-27 22:47:40'),
(156, 'Remera Zeppelin', 1, 'variable', 1, NULL, NULL, 10, 1, NULL, NULL, 'exclusive', 1, NULL, '0156', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764119709_whatsapp-image-2025-08-15-at-13-40-48-1-51875af9049542031017552776603504-1024-1024.webp', NULL, NULL, 1, 355, 0, NULL, NULL, 0, 0, '2025-11-25 22:15:09', '2025-12-27 22:47:40'),
(157, 'Remera Pizurno', 1, 'variable', 1, NULL, NULL, 10, 1, NULL, NULL, 'exclusive', 1, NULL, '0157', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764119840_whatsapp-image-2025-08-15-at-14-12-15-d0e1175ecfac9d8ef917555166851641-1024-1024.webp', NULL, NULL, 1, 356, 0, NULL, NULL, 0, 0, '2025-11-25 22:17:20', '2025-12-27 22:47:40'),
(158, 'Remera Blomster', 1, 'variable', 1, NULL, NULL, 10, 1, NULL, NULL, 'exclusive', 1, NULL, '0158', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764119937_whatsapp-image-2025-08-19-at-09-21-41-5d8c8fb1d0e7e0aeb417556065685052-1024-1024.webp', NULL, NULL, 1, 357, 0, NULL, NULL, 0, 0, '2025-11-25 22:18:57', '2025-12-27 22:47:40'),
(159, 'Remera YONES', 1, 'variable', 1, NULL, NULL, 10, 1, NULL, NULL, 'exclusive', 1, NULL, '0159', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764120051_whatsapp-image-2025-08-25-at-09-04-30-1-845c43d074f044b35217561237159142-1024-1024.webp', NULL, NULL, 1, 358, 0, NULL, NULL, 0, 0, '2025-11-25 22:20:51', '2025-12-27 22:47:40'),
(160, 'Remera Tere algodón botones laterales', 1, 'variable', 1, NULL, NULL, 10, 1, NULL, NULL, 'exclusive', 1, NULL, '0160', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764120198_whatsapp-image-2025-08-28-at-09-32-41-1-9f251462772f3ed4b217563857937770-1024-1024.webp', NULL, NULL, 1, 359, 0, NULL, NULL, 0, 0, '2025-11-25 22:23:18', '2025-12-27 22:47:40'),
(161, 'Remera YARON c strass', 1, 'variable', 1, NULL, NULL, 10, 1, NULL, NULL, 'exclusive', 1, NULL, '0161', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764120339_whatsapp-image-2025-09-02-at-08-57-48-2-5d3b34dbc59596fde917568150577561-1024-1024.webp', 937, NULL, 1, 360, 0, NULL, NULL, 0, 0, '2025-11-25 22:25:39', '2026-01-03 18:56:26'),
(162, 'Conjunto KAMIRA lino', 1, 'variable', 1, NULL, NULL, 10, 1, NULL, NULL, 'exclusive', 1, NULL, '0162', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764120522_whatsapp-image-2025-09-11-at-14-56-06-2-c2695c8189db3e93ec17576176380459-1024-1024.webp', NULL, NULL, 1, 361, 0, NULL, NULL, 0, 0, '2025-11-25 22:28:42', '2025-12-27 22:47:40'),
(163, 'Remera LORETA C Piedras', 1, 'variable', 1, NULL, NULL, 11, 1, NULL, NULL, 'exclusive', 1, NULL, '0163', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764120851_image-ba216866-a89d-4b02-9f5e-ad9a2a4f62d0-1024.webp', NULL, NULL, 1, 362, 0, NULL, NULL, 0, 0, '2025-11-25 22:34:11', '2025-12-27 22:47:40'),
(164, 'Musculosa ORI Tejida con Guipiur', 1, 'variable', 1, NULL, NULL, 11, 9, NULL, NULL, 'exclusive', 1, NULL, '0164', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764120968_image-c11bd3bd-d359-4085-ab2c-c666b70673c9-1024.webp', NULL, NULL, 1, 363, 0, NULL, NULL, 0, 0, '2025-11-25 22:36:08', '2025-12-27 22:47:40'),
(165, 'Remera MUMI C/ Bordado', 1, 'variable', 1, NULL, NULL, 11, 1, NULL, NULL, 'exclusive', 1, NULL, '0165', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764121231_50dc5f92-d8b8-4141-a204-14fb33a52ee9-1024.webp', NULL, NULL, 1, 364, 0, NULL, NULL, 0, 0, '2025-11-25 22:40:31', '2025-12-27 22:47:40'),
(166, 'Musculosa JENNY bordada', 1, 'variable', 1, NULL, NULL, 11, 9, NULL, NULL, 'exclusive', 1, NULL, '0166', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764121604_image-e32d1786-4cd0-41b0-beae-092a63f15202-1024.webp', 884, NULL, 1, 365, 0, NULL, NULL, 0, 0, '2025-11-25 22:46:44', '2026-01-03 18:56:26'),
(167, 'Musculosa MIRI c/ piedras', 1, 'variable', 1, NULL, NULL, 11, 1, NULL, NULL, 'exclusive', 1, NULL, '0167', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764121735_5b3ec298-2a42-4639-b93a-fb02ce8b3863-1024.webp', NULL, NULL, 1, 366, 0, NULL, NULL, 0, 0, '2025-11-25 22:48:55', '2025-12-27 22:47:40'),
(168, 'Blusa NADINE Broderie Bordada', 1, 'variable', 1, NULL, NULL, 11, 20, NULL, NULL, 'exclusive', 1, NULL, '0168', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764122533_2ceb8f4c-5f21-4528-9f3c-536e579c0093-1024.webp', NULL, NULL, 1, 367, 0, NULL, NULL, 0, 0, '2025-11-25 23:02:13', '2025-12-27 22:47:40'),
(169, 'Musculosa KAIA Bordada', 1, 'variable', 1, NULL, NULL, 11, 9, NULL, NULL, 'exclusive', 1, NULL, '0169', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764198594_0ad62719-0050-4126-b66e-7a9284f3c80e-1024.webp', NULL, NULL, 1, 368, 0, NULL, NULL, 0, 0, '2025-11-26 20:09:54', '2025-12-27 22:47:40'),
(170, 'Remera ARDEN c Piedras', 1, 'variable', 1, NULL, NULL, 11, 1, NULL, NULL, 'exclusive', 1, NULL, '0170', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764198840_09bd774e-522c-4cef-938f-56d73524c77a-1024.webp', NULL, NULL, 1, 369, 0, NULL, NULL, 0, 0, '2025-11-26 20:14:00', '2025-12-27 22:47:40'),
(171, 'Mini Queen Dinasty Lentejuelas y Tull', 1, 'variable', 1, NULL, NULL, 11, 7, NULL, NULL, 'exclusive', 1, NULL, '0171', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764199096_1e02f5c0-d9a4-498c-826c-c2d1815f329e-1024.webp', NULL, NULL, 1, 370, 0, NULL, NULL, 0, 0, '2025-11-26 20:18:16', '2025-12-27 22:47:40'),
(172, 'Blazer Metalizado Cruzado', 1, 'variable', 1, NULL, NULL, 11, 18, NULL, NULL, 'exclusive', 1, NULL, '0172', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764199215_image-04859ca5-0d00-42f6-b3e2-96d7668c20e5-1024.webp', NULL, NULL, 1, 371, 0, NULL, NULL, 0, 0, '2025-11-26 20:20:15', '2025-12-27 22:47:40'),
(173, 'Musculosa Beauty Black Lentejuelas', 1, 'variable', 1, NULL, NULL, 11, 9, NULL, NULL, 'exclusive', 1, NULL, '0173', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764199342_image-ab3edfc9-1a69-4f4d-bc78-6fc04a3cf37d-1024.webp', NULL, NULL, 1, 372, 0, NULL, NULL, 0, 0, '2025-11-26 20:22:22', '2025-12-27 22:47:40'),
(174, 'Musculosa Beauty Cream Lentejuelas', 1, 'variable', 1, NULL, NULL, 11, 9, NULL, NULL, 'exclusive', 1, NULL, '0174', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764199815_image-cef922f8-1b99-43eb-a5e3-59eb4bc6c124-1024.webp', NULL, NULL, 1, 373, 0, NULL, NULL, 0, 0, '2025-11-26 20:30:15', '2025-12-27 22:47:40'),
(175, 'Blusa Lorenza', 1, 'variable', 1, NULL, NULL, 12, 20, NULL, NULL, 'exclusive', 1, NULL, '0175', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764200352_lushka-134-d22071898867d36cb117630599537720-1024-1024.webp', NULL, NULL, 1, 374, 0, NULL, NULL, 0, 0, '2025-11-26 20:39:12', '2025-12-27 22:47:40'),
(176, 'Campera Tatum Jean', 1, 'variable', 1, NULL, NULL, 12, 19, NULL, NULL, 'exclusive', 1, NULL, '0176', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764200480_whatsapp-image-2025-09-25-at-15-58-44-1-f6c2c002a3a76d50a017588281953736-1024-1024.webp', NULL, NULL, 1, 375, 0, NULL, NULL, 0, 0, '2025-11-26 20:41:20', '2025-12-27 22:47:40'),
(177, 'Chaleco DUNCAN', 1, 'variable', 1, NULL, NULL, 12, 21, NULL, NULL, 'exclusive', 1, NULL, '0177', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1764200705_lushka-22-7673696c0551938aa817621959367179-1024-1024.webp', NULL, NULL, 1, 376, 0, NULL, NULL, 0, 0, '2025-11-26 20:45:05', '2025-12-27 22:47:40'),
(178, 'Chaleco Felix', 1, 'variable', 1, NULL, NULL, 12, 21, NULL, NULL, 'exclusive', 1, NULL, '0178', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764200835_lushka-52-f8e464749fe220206817624519998574-1024-1024.webp', NULL, NULL, 1, 377, 0, NULL, NULL, 0, 0, '2025-11-26 20:47:15', '2025-12-27 22:47:40'),
(179, 'Pollera MARTINA', 1, 'variable', 1, NULL, NULL, 12, 15, NULL, NULL, 'exclusive', 1, NULL, '0179', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764200980_img-3465-811d25052f489ad35917011786664687-1024-1024.webp', NULL, NULL, 1, 378, 0, NULL, NULL, 0, 0, '2025-11-26 20:49:40', '2025-12-27 22:47:40'),
(180, 'Skort Kopar encaje', 1, 'variable', 1, NULL, NULL, 12, 4, NULL, NULL, 'exclusive', 1, NULL, '0180', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764201113_whatsapp-image-2025-09-29-at-14-18-11-2-0289d59e9336d412ae17591688546915-1024-1024.webp', NULL, NULL, 1, 379, 0, NULL, NULL, 0, 0, '2025-11-26 20:51:53', '2025-12-27 22:47:40'),
(181, 'Mini bordada Danielle', 1, 'variable', 1, NULL, NULL, 12, 7, NULL, NULL, 'exclusive', 1, NULL, '0181', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764201313_lushka-baja-245-e523569d24b0d4e38617612305623488-1024-1024.webp', NULL, NULL, 1, 380, 0, NULL, NULL, 0, 0, '2025-11-26 20:55:13', '2025-12-27 22:47:40'),
(182, 'Palazo JOHNSON liso', 1, 'variable', 1, NULL, NULL, 12, 2, NULL, NULL, 'exclusive', 1, NULL, '0182', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764202257_lushka-baja-5-977bca343e0935058717152552994530-1024-1024.webp', NULL, NULL, 1, 381, 0, NULL, NULL, 0, 0, '2025-11-26 21:10:57', '2025-12-27 22:47:40'),
(183, 'Pantalon Baduz con vivos', 1, 'variable', 1, NULL, NULL, 12, 2, NULL, NULL, 'exclusive', 1, NULL, '0183', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1764202678_lushka-31-d50ca1ac8bcfa6821117521622368644-1024-1024.webp', NULL, NULL, 1, 382, 0, NULL, NULL, 0, 0, '2025-11-26 21:17:58', '2025-12-27 22:47:40'),
(184, 'Top BAHIA', 1, 'variable', 1, NULL, NULL, 12, 14, NULL, NULL, 'exclusive', 1, NULL, '0184', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764202818_img-4804-705bc9c6082576866717207098664210-1024-1024.webp', NULL, NULL, 1, 383, 0, NULL, NULL, 0, 0, '2025-11-26 21:20:18', '2025-12-27 22:47:40'),
(185, 'Top Venecia', 1, 'variable', 1, NULL, NULL, 12, 14, NULL, NULL, 'exclusive', 1, NULL, '0185', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764202945_lushka-baja-130-4b0b8b0ff7817b1b5f17612324902219-1024-1024.webp', 37154, NULL, 1, 384, 0, NULL, NULL, 0, 0, '2025-11-26 21:22:25', '2026-01-03 18:56:26'),
(186, 'Blusa Guada Bordada', 1, 'variable', 1, NULL, NULL, 12, 20, NULL, NULL, 'exclusive', 1, NULL, '0186', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764203057_lushka-24-96f5967123b354f62217621947822442-1024-1024.webp', NULL, NULL, 1, 385, 0, NULL, NULL, 0, 0, '2025-11-26 21:24:17', '2025-12-27 22:47:40'),
(188, 'Remera ANTONIA CON TACHAS', 1, 'variable', 1, NULL, NULL, 12, 1, NULL, NULL, 'exclusive', 1, NULL, '0188', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764203375_lushka-411c8d1c256f56cc0b17615810501462-1024-1024.webp', NULL, NULL, 1, 386, 0, NULL, NULL, 0, 0, '2025-11-26 21:29:35', '2025-12-27 22:47:40'),
(189, 'Pantalon NEW PAUNETTE BORDADO', 1, 'variable', 1, NULL, NULL, 12, 2, NULL, NULL, 'exclusive', 1, NULL, '0189', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1764203516_lushka-25-c6b7e254a0e1eee6d117615814690516-1024-1024.webp', NULL, NULL, 1, 387, 0, NULL, NULL, 0, 0, '2025-11-26 21:31:56', '2025-12-27 22:47:40'),
(190, 'Remera Daiton', 1, 'variable', 1, NULL, NULL, 12, 1, NULL, NULL, 'exclusive', 1, NULL, '0190', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764203666_lushka-7-89bce044ceccf817a117519761984605-1024-1024.webp', NULL, NULL, 1, 388, 0, NULL, NULL, 0, 0, '2025-11-26 21:34:26', '2025-12-27 22:47:40'),
(191, 'Chaqueta ROCKVILLE', 1, 'single', 1, NULL, NULL, 12, 19, NULL, NULL, 'exclusive', 1, NULL, '0191', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764204920_lushka-72-d5f7ccf740a445d08c17568411744513-1024-1024.jpg', 389, NULL, 1, 390, 0, NULL, NULL, 0, 0, '2025-11-26 21:55:20', '2025-12-27 22:47:40'),
(192, 'Top Doha', 1, 'variable', 1, NULL, NULL, 12, 14, NULL, NULL, 'exclusive', 1, NULL, '0192', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764528086_lushka-mujer-baja-147-61368394565608575117569991227504-1024-1024.jpg', 391, NULL, 1, 392, 0, NULL, NULL, 0, 0, '2025-11-30 15:41:26', '2025-12-27 22:47:40'),
(193, 'Mini Turquie Jean', 1, 'variable', 1, NULL, NULL, 12, 7, NULL, NULL, 'exclusive', 1, NULL, '0193', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764528221_lushka-baja-30-52b920b986cb03f54017588289389193-1024-1024.webp', NULL, NULL, 1, 393, 0, NULL, NULL, 0, 0, '2025-11-30 15:43:41', '2025-12-27 22:47:40'),
(194, 'Blusa Lina', 1, 'variable', 1, NULL, NULL, 12, 20, NULL, NULL, 'exclusive', 1, NULL, '0194', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764528743_lushka-baja-43-0202562c111f3864fc17589001825872-1024-1024.webp', NULL, NULL, 1, 394, 0, NULL, NULL, 0, 0, '2025-11-30 15:52:23', '2025-12-27 22:47:40'),
(195, 'Short QUEBEC', 1, 'variable', 1, NULL, NULL, 12, 4, NULL, NULL, 'exclusive', 1, NULL, '0195', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1766946830_lushka-baja-13-b26c877f8691902aef17596778963325-1024-1024.webp', 37152, NULL, 1, 395, 0, NULL, NULL, 0, 0, '2025-11-30 15:55:10', '2026-01-03 18:56:26'),
(196, 'Short AMPI', 1, 'variable', 1, NULL, NULL, 12, 4, NULL, NULL, 'exclusive', 1, NULL, '0196', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764529072_lushka-26-a10c53d01f2d6fb00f17617671706591-1024-1024.webp', NULL, NULL, 1, 396, 0, NULL, NULL, 0, 0, '2025-11-30 15:57:52', '2025-12-27 22:47:40'),
(197, 'Top Glads', 1, 'variable', 1, NULL, NULL, 12, 14, NULL, NULL, 'exclusive', 1, NULL, '0197', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764529281_lushka-baja-29-27ad4ea222555f61b917612312653305-1024-1024.webp', NULL, NULL, 1, 397, 0, NULL, NULL, 0, 0, '2025-11-30 16:01:21', '2025-12-27 22:47:40'),
(198, 'Remera The Angel bordada', 1, 'variable', 1, NULL, NULL, 12, 1, NULL, NULL, 'exclusive', 1, NULL, '0198', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764529420_lushka-30-4472507df773fa60cb17621957894407-1024-1024.webp', NULL, NULL, 1, 398, 0, NULL, NULL, 0, 0, '2025-11-30 16:03:40', '2025-12-27 22:47:40'),
(199, 'Short Milano', 1, 'variable', 1, NULL, NULL, 13, 4, NULL, NULL, 'exclusive', 1, NULL, '0199', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764529654_whatsapp-image-2025-01-09-at-15-42-00-1-926d3c2fbe4aa7a0a717365261763262-640-0.webp', NULL, NULL, 1, 399, 0, NULL, NULL, 0, 0, '2025-11-30 16:07:34', '2025-12-27 22:47:40'),
(200, 'Short Losty', 1, 'variable', 1, NULL, NULL, 13, 4, NULL, NULL, 'exclusive', 1, NULL, '0200', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764530046_whatsapp-image-2023-12-13-at-15-27-37-1-ebdb85ff6dda825e6e17026437132251-640-0.webp', NULL, NULL, 1, 400, 0, NULL, NULL, 0, 0, '2025-11-30 16:14:06', '2025-12-27 22:47:40'),
(201, 'Short Murcia', 1, 'variable', 1, NULL, NULL, 13, 4, NULL, NULL, 'exclusive', 1, NULL, '0201', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764530288_whatsapp-image-2024-09-28-at-08-26-36-430e359734c72bc6ea17275228893807-640-0.webp', NULL, NULL, 1, 401, 0, NULL, NULL, 0, 0, '2025-11-30 16:18:08', '2025-12-27 22:47:40'),
(202, 'Short Mubba Verde', 1, 'variable', 1, NULL, NULL, 13, 4, NULL, NULL, 'exclusive', 1, NULL, '0202', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764530524_whatsapp-image-2024-09-26-at-09-44-38-3-f6bcd4bbe9343b415b17273547782087-640-0.webp', NULL, NULL, 1, 402, 0, NULL, NULL, 0, 0, '2025-11-30 16:22:04', '2025-12-27 22:47:40'),
(204, 'Short Murely', 1, 'variable', 1, NULL, NULL, 13, 4, NULL, NULL, 'exclusive', 1, NULL, '0204', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764530966_whatsapp-image-2023-12-13-at-14-36-54-1b1cadb70c26d2af8017026437950300-640-0.webp', NULL, NULL, 1, 403, 0, NULL, NULL, 0, 0, '2025-11-30 16:29:26', '2025-12-27 22:47:40'),
(205, 'Short Pekin', 1, 'variable', 1, NULL, NULL, 13, 4, NULL, NULL, 'exclusive', 1, NULL, '0205', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1764531377_whatsapp-image-2025-11-05-at-10-35-35-2-a31dd7549df94de90e17623514126827-640-0.webp', NULL, NULL, 1, 404, 0, NULL, NULL, 0, 0, '2025-11-30 16:36:17', '2025-12-27 22:47:40'),
(206, 'Short Nina', 1, 'variable', 1, NULL, NULL, 13, 4, NULL, NULL, 'exclusive', 1, NULL, '0206', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764531848_whatsapp-image-2024-10-24-at-16-38-28-1-70f7729ea03fd0fe2d17297988439503-640-0.webp', NULL, NULL, 1, 405, 0, NULL, NULL, 0, 0, '2025-11-30 16:44:08', '2025-12-27 22:47:40'),
(207, 'Short Madrid', 1, 'variable', 1, NULL, NULL, 13, 4, NULL, NULL, 'exclusive', 1, NULL, '0207', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764532001_whatsapp-image-2024-12-30-at-16-08-11-44c1f09dc7a2428a8d17356501194685-1024-1024.webp', NULL, NULL, 1, 406, 0, NULL, NULL, 0, 0, '2025-11-30 16:46:41', '2025-12-27 22:47:40'),
(208, 'Short Jizan', 1, 'variable', 1, NULL, NULL, 13, 4, NULL, NULL, 'exclusive', 1, NULL, '0208', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764532262_whatsapp-image-2024-09-25-at-13-42-59-2-cd5fd62894184edfa517272830339683-640-0.webp', NULL, NULL, 1, 407, 0, NULL, NULL, 0, 0, '2025-11-30 16:51:02', '2025-12-27 22:47:41'),
(209, 'Short Oxid', 1, 'variable', 1, NULL, NULL, 13, 4, NULL, NULL, 'exclusive', 1, NULL, '0209', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764532604_img-4993-4999f16d649895c32d17617437519376-480-0.webp', NULL, NULL, 1, 550, 0, NULL, NULL, 0, 0, '2025-11-30 16:56:44', '2025-12-27 22:52:08'),
(210, 'Pollera boho microtull', 1, 'variable', 1, NULL, NULL, 14, 15, NULL, NULL, 'exclusive', 1, NULL, '0210', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764532947_whatsapp-image-2025-09-04-at-125221-pm.jpeg', NULL, NULL, 1, 552, 0, NULL, NULL, 0, 0, '2025-11-30 17:02:27', '2025-12-27 22:52:08'),
(211, 'Pollera micro volados', 1, 'variable', 1, NULL, NULL, 14, 15, NULL, NULL, 'exclusive', 1, NULL, '0211', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764533336_unnamed.jpg', NULL, NULL, 1, 554, 0, NULL, NULL, 0, 0, '2025-11-30 17:08:56', '2025-12-27 22:52:08'),
(212, 'Pollera plato micromorley', 1, 'variable', 1, NULL, NULL, 14, 15, NULL, NULL, 'exclusive', 1, NULL, '0212', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764533604_whatsapp-image-2025-08-04-at-24226-pm.jpeg', NULL, NULL, 1, 556, 0, NULL, NULL, 0, 0, '2025-11-30 17:13:24', '2025-12-27 22:52:08'),
(213, 'TOP ROMBO MICROTULL', 1, 'variable', 1, NULL, NULL, 14, 14, NULL, NULL, 'exclusive', 1, NULL, '0213', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764533803_c2f41046-b787-42a9-8e2e-6c90831515d6.jpeg', NULL, NULL, 1, 558, 0, NULL, NULL, 0, 0, '2025-11-30 17:16:43', '2025-12-27 22:52:08'),
(214, 'Top boho lentejuela', 1, 'variable', 1, NULL, NULL, 14, 14, NULL, NULL, 'exclusive', 1, NULL, '0214', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764533978_whatsapp-image-2025-09-18-at-13331-pm.jpeg', NULL, NULL, 1, 560, 0, NULL, NULL, 0, 0, '2025-11-30 17:19:38', '2025-12-27 22:52:08'),
(215, 'Top bralet con buche', 1, 'variable', 1, NULL, NULL, 14, 14, NULL, NULL, 'exclusive', 1, NULL, '0215', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764534090_whatsapp-image-2025-08-04-at-114108-am-1.jpeg', NULL, NULL, 1, 562, 0, NULL, NULL, 0, 0, '2025-11-30 17:21:30', '2025-12-27 22:52:08'),
(216, 'Top corset importado con cinta', 1, 'variable', 1, NULL, NULL, 14, 14, NULL, NULL, 'exclusive', 1, NULL, '0216', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764534236_whatsapp-image-2025-11-07-at-112558-am.jpeg', NULL, NULL, 1, 564, 0, NULL, NULL, 0, 0, '2025-11-30 17:23:56', '2025-12-27 22:52:08'),
(217, 'Top crochet Marilyn', 1, 'variable', 1, NULL, NULL, 14, 14, NULL, NULL, 'exclusive', 1, NULL, '0217', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764534424_whatsapp-image-2025-11-07-at-115057-am.jpeg', NULL, NULL, 1, 566, 0, NULL, NULL, 0, 0, '2025-11-30 17:27:04', '2025-12-27 22:52:08'),
(218, 'Top importado bretel cintas', 1, 'variable', 1, NULL, NULL, 14, 14, NULL, NULL, 'exclusive', 1, NULL, '0218', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764534669_whatsapp-image-2025-11-07-at-13134-pm.jpeg', NULL, NULL, 1, 568, 0, NULL, NULL, 0, 0, '2025-11-30 17:31:09', '2025-12-27 22:52:08'),
(219, 'Top retro hombro frunce', 1, 'variable', 1, NULL, NULL, 14, 14, NULL, NULL, 'exclusive', 1, NULL, '0219', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764534922_img-20250816-wa0045.jpg', NULL, NULL, 1, 570, 0, NULL, NULL, 0, 0, '2025-11-30 17:35:22', '2025-12-27 22:52:08'),
(220, 'Top retro lluvia de strass', 1, 'variable', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'exclusive', 1, NULL, '0220', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764535052_whatsapp-image-2025-11-07-at-110514-am.jpeg', NULL, NULL, 1, 572, 0, NULL, NULL, 0, 0, '2025-11-30 17:37:32', '2025-12-27 22:52:08'),
(221, 'Top retro óvalo con avío', 1, 'variable', 1, NULL, NULL, 14, 14, NULL, NULL, 'exclusive', 1, NULL, '0221', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764535178_5f57465f-aa54-4678-89c7-c3fc03d5cec6.jpeg', NULL, NULL, 1, 574, 0, NULL, NULL, 0, 0, '2025-11-30 17:39:38', '2025-12-27 22:52:08'),
(222, 'Vestido Strapless', 1, 'variable', 1, NULL, NULL, 14, 16, NULL, NULL, 'exclusive', 1, NULL, '0222', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764535494_unnamed-1.jpg', NULL, NULL, 1, 576, 0, NULL, NULL, 0, 0, '2025-11-30 17:44:54', '2025-12-27 22:52:08'),
(223, 'Vestido asimétrico', 1, 'variable', 1, NULL, NULL, 14, 16, NULL, NULL, 'exclusive', 1, NULL, '0223', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764535722_71cf8a12-b9e0-4cf3-b0ee-eb6cc0b44b55.jpeg', NULL, NULL, 1, 578, 0, NULL, NULL, 0, 0, '2025-11-30 17:48:42', '2025-12-27 22:52:08'),
(224, 'Vestido lunares', 1, 'variable', 1, NULL, NULL, 14, 16, NULL, NULL, 'exclusive', 1, NULL, '0224', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764535873_whatsapp-image-2025-10-03-at-115525-am.jpeg', NULL, NULL, 1, 580, 0, NULL, NULL, 0, 0, '2025-11-30 17:51:13', '2025-12-27 22:52:08'),
(225, 'Vestido strapless lluvia de strass', 1, 'variable', 1, NULL, NULL, 14, 16, NULL, NULL, 'exclusive', 1, NULL, '0225', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764536209_fc7637e3-00d3-4c94-b524-14bffd8ce270.jpeg', NULL, NULL, 1, 582, 0, NULL, NULL, 0, 0, '2025-11-30 17:56:49', '2025-12-27 22:52:08'),
(226, 'Vestido strapless meduza', 1, 'variable', 1, NULL, NULL, 14, 16, NULL, NULL, 'exclusive', 1, NULL, '0226', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764536486_72638b73-b7c7-46c9-a776-e1ea844e6ceb.jpeg', NULL, NULL, 1, 584, 0, NULL, NULL, 0, 0, '2025-11-30 18:01:26', '2025-12-27 22:52:08'),
(227, 'Vestido straple misha', 1, 'variable', 1, NULL, NULL, 14, 16, NULL, NULL, 'exclusive', 1, NULL, '0227', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764536632_whatsapp-image-2025-10-03-at-20345-pm.jpeg', NULL, NULL, 1, 586, 0, NULL, NULL, 0, 0, '2025-11-30 18:03:52', '2025-12-27 22:52:08'),
(228, 'vestido straples accesorio U', 1, 'variable', 1, NULL, NULL, 14, 16, NULL, NULL, 'exclusive', 1, NULL, '0228', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764536761_whatsapp-image-2025-10-03-at-14932-pm.jpeg', NULL, NULL, 1, 588, 0, NULL, NULL, 0, 0, '2025-11-30 18:06:01', '2025-12-27 22:52:08'),
(229, 'vestido strapless recorte', 1, 'variable', 1, NULL, NULL, 14, 16, NULL, NULL, 'exclusive', 1, NULL, '0229', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764536884_d8639c32-157d-4322-a7e9-3a7b092c8779.jpeg', NULL, NULL, 1, 590, 0, NULL, NULL, 0, 0, '2025-11-30 18:08:04', '2025-12-27 22:52:08'),
(231, 'Short cancun conjunto', 1, 'variable', 1, NULL, NULL, 15, 4, NULL, NULL, 'exclusive', 1, NULL, '0231', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764538324_short-cancun-conjunto-5.jpg', NULL, NULL, 1, 592, 0, NULL, NULL, 0, 0, '2025-11-30 18:32:04', '2025-12-27 22:52:09'),
(232, 'Musculosa vallarda', 1, 'variable', 1, NULL, NULL, 15, 9, NULL, NULL, 'exclusive', 1, NULL, '0232', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764538512_musculosa-vallarda-4.jpg', NULL, NULL, 1, 594, 0, NULL, NULL, 0, 0, '2025-11-30 18:35:12', '2025-12-27 22:52:09'),
(233, 'Remera Allende conjunto', 1, 'variable', 1, NULL, NULL, 15, 1, NULL, NULL, 'exclusive', 1, NULL, '0233', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764538610_short-allende-conjunto-1.jpg', NULL, NULL, 1, 596, 0, NULL, NULL, 0, 0, '2025-11-30 18:36:50', '2025-12-27 22:52:09'),
(234, 'Remera Cancun conjunto', 1, 'variable', 1, NULL, NULL, 15, 1, NULL, NULL, 'exclusive', 1, NULL, '0234', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764538771_remera-cancun-conjunto.jpg', NULL, NULL, 1, 598, 0, NULL, NULL, 0, 0, '2025-11-30 18:39:31', '2025-12-27 22:52:09'),
(235, 'Remera Oaxaca', 1, 'variable', 1, NULL, NULL, 15, 1, NULL, NULL, 'exclusive', 1, NULL, '0235', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764539063_remera-oaxaca-4.jpg', NULL, NULL, 1, 600, 0, NULL, NULL, 0, 0, '2025-11-30 18:44:23', '2025-12-27 22:52:09'),
(236, 'Remera Guadalajara', 1, 'variable', 1, NULL, NULL, 15, 1, NULL, NULL, 'exclusive', 1, NULL, '0236', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764539476_remera-guadalajara-1.jpg', NULL, NULL, 1, 602, 0, NULL, NULL, 0, 0, '2025-11-30 18:51:16', '2025-12-27 22:52:09'),
(237, 'Camisa N-700', 1, 'variable', 1, NULL, NULL, 16, 11, NULL, NULL, 'exclusive', 1, NULL, '0237', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1764540474_530b45a48ba546652f60af7999692186.jpg', NULL, NULL, 1, 604, 0, NULL, NULL, 0, 0, '2025-11-30 19:03:02', '2025-12-27 22:52:09'),
(238, 'Malla JR-25513', 1, 'variable', 1, NULL, NULL, 16, 22, NULL, NULL, 'exclusive', 1, NULL, '0238', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764540594_3dafdf1cf4af1caada07e3818bb33618.jpg', NULL, NULL, 1, 606, 0, NULL, NULL, 0, 0, '2025-11-30 19:09:54', '2025-12-27 22:52:09'),
(239, 'Malla JR-25512', 1, 'variable', 1, NULL, NULL, 16, 22, NULL, NULL, 'exclusive', 1, NULL, '0239', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1764550123_5bc931fa4088544780914536f6da35df.jpg', 38096, NULL, 1, 608, 0, NULL, NULL, 0, 0, '2025-11-30 21:48:43', '2026-01-03 18:56:38'),
(240, 'Pantalon K-250403', 1, 'variable', 1, NULL, NULL, 16, 2, NULL, NULL, 'exclusive', 1, NULL, '0240', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764550490_24b4c090a206fe9e5a44c093fbf17877.jpg', NULL, NULL, 1, 610, 0, NULL, NULL, 0, 0, '2025-11-30 21:54:50', '2025-12-27 22:52:09'),
(241, 'Bermuda k-250408', 1, 'variable', 1, NULL, NULL, 16, 23, NULL, NULL, 'exclusive', 1, NULL, '0241', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1764550905_5b8adc5901a215600d374ea31537ef9b.jpg', NULL, NULL, 1, 612, 0, NULL, NULL, 0, 0, '2025-11-30 22:01:45', '2025-12-27 22:52:09'),
(242, 'Bermuda k-250406', 1, 'variable', 1, NULL, NULL, 16, 23, NULL, NULL, 'exclusive', 1, NULL, '0242', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764551089_0327739976ea9aba38c7f26d089a4b88.jpg', NULL, NULL, 1, 614, 0, NULL, NULL, 0, 0, '2025-11-30 22:04:49', '2025-12-27 22:52:09'),
(243, 'Chomba jp-01', 1, 'variable', 1, NULL, NULL, 16, 10, NULL, NULL, 'exclusive', 1, NULL, '0243', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764551323_87132c8d5afbdcf195982732c3d4148b.jpg', NULL, NULL, 1, 616, 0, NULL, NULL, 0, 0, '2025-11-30 22:08:43', '2025-12-27 22:52:09'),
(244, 'Chomba J-1036', 1, 'variable', 1, NULL, NULL, 16, 10, NULL, NULL, 'exclusive', 1, NULL, '0244', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764551525_9ccc542ac15520cd2cc3564a2d1224cf.jpg', NULL, NULL, 1, 618, 0, NULL, NULL, 0, 0, '2025-11-30 22:12:05', '2025-12-27 22:52:09');
INSERT INTO `products` (`id`, `name`, `business_id`, `type`, `unit_id`, `secondary_unit_id`, `sub_unit_ids`, `brand_id`, `category_id`, `sub_category_id`, `tax`, `tax_type`, `enable_stock`, `alert_quantity`, `sku`, `barcode_type`, `expiry_period`, `expiry_period_type`, `enable_sr_no`, `weight`, `product_custom_field1`, `product_custom_field2`, `product_custom_field3`, `product_custom_field4`, `product_custom_field5`, `product_custom_field6`, `product_custom_field7`, `product_custom_field8`, `product_custom_field9`, `product_custom_field10`, `product_custom_field11`, `product_custom_field12`, `product_custom_field13`, `product_custom_field14`, `product_custom_field15`, `product_custom_field16`, `product_custom_field17`, `product_custom_field18`, `product_custom_field19`, `product_custom_field20`, `image`, `woocommerce_media_id`, `product_description`, `created_by`, `woocommerce_product_id`, `woocommerce_disable_sync`, `preparation_time_in_minutes`, `warranty_id`, `is_inactive`, `not_for_selling`, `created_at`, `updated_at`) VALUES
(245, 'Chomba J-1035', 1, 'variable', 1, NULL, NULL, 16, 10, NULL, NULL, 'exclusive', 1, NULL, '0245', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764551659_475c9be3440d236f6b09afb4adbb5685.jpg', NULL, NULL, 1, 620, 0, NULL, NULL, 0, 0, '2025-11-30 22:14:19', '2025-12-27 22:52:09'),
(246, 'Chomba Jp-06 over', 1, 'variable', 1, NULL, NULL, 16, 10, NULL, NULL, 'exclusive', 1, NULL, '0246', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764551826_54c53c85b497d65f339d7c559d6f7f6f.jpg', NULL, NULL, 1, 622, 0, NULL, NULL, 0, 0, '2025-11-30 22:17:06', '2025-12-27 22:52:09'),
(247, 'Remera J-1120', 1, 'variable', 1, NULL, NULL, 16, 1, NULL, NULL, 'exclusive', 1, NULL, '0247', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764638326_9a9ae27f5405c6ce8e08669f07cee0cf.jpg', NULL, NULL, 1, 624, 0, NULL, NULL, 0, 0, '2025-12-01 22:18:46', '2025-12-27 22:52:09'),
(248, 'Remera Na-10', 1, 'variable', 1, NULL, NULL, 16, 1, NULL, NULL, 'exclusive', 1, NULL, '0248', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764638440_84f516f3e29bc5385b3c5a9d4b9d432c.jpg', NULL, NULL, 1, 626, 0, NULL, NULL, 0, 0, '2025-12-01 22:20:40', '2025-12-27 22:52:09'),
(249, 'Remera Na-19', 1, 'variable', 1, NULL, NULL, 16, 1, NULL, NULL, 'exclusive', 1, NULL, '0249', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764638576_1fe22e54cfa9985bc0de89a3b590f127.jpg', NULL, NULL, 1, 628, 0, NULL, NULL, 0, 0, '2025-12-01 22:22:56', '2025-12-27 22:52:09'),
(250, 'Remera Básica', 1, 'variable', 1, NULL, NULL, 16, 1, NULL, NULL, 'exclusive', 1, NULL, '0250', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1764638744_07022b5b0ed8e07d9aaa71ab53159823.jpg', 630, NULL, 1, 631, 0, NULL, NULL, 0, 0, '2025-12-01 22:25:44', '2025-12-27 22:52:09'),
(251, 'Remera Art 1639', 1, 'variable', 1, NULL, NULL, 16, 1, NULL, NULL, 'exclusive', 1, NULL, '0251', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764638890_09df5a4db17c134ba1fdfe47773d14f8.jpg', 632, NULL, 1, 633, 0, NULL, NULL, 0, 0, '2025-12-01 22:28:10', '2025-12-27 22:52:09'),
(252, 'Remera na-03', 1, 'variable', 1, NULL, NULL, 16, 1, NULL, NULL, 'exclusive', 1, NULL, '0252', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764639013_5a6d00f55e1f9efe1164fa780e488a6d.jpg', 634, NULL, 1, 635, 0, NULL, NULL, 0, 0, '2025-12-01 22:30:13', '2025-12-27 22:52:09'),
(253, 'Remera Na-15', 1, 'variable', 1, NULL, NULL, 16, 1, NULL, NULL, 'exclusive', 1, NULL, '0253', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764639141_6cc4329a99707460a5366307c642508e.jpg', 636, NULL, 1, 637, 0, NULL, NULL, 0, 0, '2025-12-01 22:32:21', '2025-12-27 22:52:09'),
(254, 'Remera na-07', 1, 'variable', 1, NULL, NULL, 16, 1, NULL, NULL, 'exclusive', 1, NULL, '0254', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764639266_55f088e11974c96a3901ed37c471cbbf.jpg', 638, NULL, 1, 639, 0, NULL, NULL, 0, 0, '2025-12-01 22:34:26', '2025-12-27 22:52:09'),
(255, 'Remera na-14', 1, 'variable', 1, NULL, NULL, 16, 1, NULL, NULL, 'exclusive', 1, NULL, '0255', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764639383_6a5f783b42ad651a6a8c98e89903d9ef.jpg', 640, NULL, 1, 641, 0, NULL, NULL, 0, 0, '2025-12-01 22:36:23', '2025-12-27 22:52:09'),
(256, 'Remera na-11', 1, 'variable', 1, NULL, NULL, 16, 1, NULL, NULL, 'exclusive', 1, NULL, '0256', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764639500_16992b8666a52210edd14b46c5606b78.jpg', 642, NULL, 1, 643, 0, NULL, NULL, 0, 0, '2025-12-01 22:38:20', '2025-12-27 22:52:09'),
(257, 'Remera km-23', 1, 'variable', 1, NULL, NULL, 16, 1, NULL, NULL, 'exclusive', 1, NULL, '0257', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764639610_32c1245d07e17c058931eb2136d5a700.jpg', 644, NULL, 1, 645, 0, NULL, NULL, 0, 0, '2025-12-01 22:40:10', '2025-12-27 22:52:09'),
(258, 'Remera na-04', 1, 'variable', 1, NULL, NULL, 16, 1, NULL, NULL, 'exclusive', 1, NULL, '0258', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764639717_95b80a67f2b2414131c4c2c32b92de30.jpg', 646, NULL, 1, 647, 0, NULL, NULL, 0, 0, '2025-12-01 22:41:57', '2025-12-27 22:52:09'),
(259, 'Short Pollera Vesnia.Cey bordado con volados en capas', 1, 'variable', 1, NULL, NULL, 17, 4, NULL, NULL, 'exclusive', 1, NULL, '0259', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764725706_imagen-de-whatsapp-2025-11-12-a-las-13-07-19-ec44f2d9-6914b0ea98016.webp', 37132, NULL, 1, 648, 0, NULL, NULL, 0, 0, '2025-12-02 22:35:06', '2026-01-03 18:56:38'),
(260, 'Top Thessia.Crochet asimetrico de un solo hombro c/hebilla', 1, 'variable', 1, NULL, NULL, 17, 14, NULL, NULL, 'exclusive', 1, NULL, '0260', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764725829_30126-m-5-6916312e48f3a.jpg', 649, NULL, 1, 650, 0, NULL, NULL, 0, 0, '2025-12-02 22:37:09', '2025-12-27 22:52:09'),
(261, 'Musculosa Sunny.Morley Dior jaspeado', 1, 'variable', 1, NULL, NULL, 17, 9, NULL, NULL, 'exclusive', 1, NULL, '0261', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764725989_3020-m-10-690b6879b5cd3.jpg', 651, NULL, 1, 652, 0, NULL, NULL, 0, 0, '2025-12-02 22:39:49', '2025-12-27 22:52:09'),
(262, 'Musculosa Thalia.Nina rib cuello redondo', 1, 'variable', 1, NULL, NULL, 17, 9, NULL, NULL, 'exclusive', 1, NULL, '0262', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1764726356_3095-m-1-690b5ef1ea64a-o.jpg', 653, NULL, 1, 654, 0, NULL, NULL, 0, 0, '2025-12-02 22:45:56', '2025-12-27 22:52:09'),
(263, 'Short pollera Dessa.Sastrero liso c cierre y botones', 1, 'variable', 1, NULL, NULL, 17, 4, NULL, NULL, 'exclusive', 1, NULL, '0263', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764726486_3004-3030-m-3-68f133770b7a7.jpg', 655, NULL, 1, 656, 0, NULL, NULL, 0, 0, '2025-12-02 22:48:06', '2025-12-27 22:52:09'),
(264, 'Short Elda.Sastrero cpinza y cordón', 1, 'variable', 1, NULL, NULL, 17, 4, NULL, NULL, 'exclusive', 1, NULL, '0264', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764726596_3070-3067-m-5-68d6c0ccd7d85.jpg', 657, NULL, 1, 658, 0, NULL, NULL, 0, 0, '2025-12-02 22:49:56', '2025-12-27 22:52:09'),
(265, 'Musculosa Percy.Morley vintage cuello en U', 1, 'variable', 1, NULL, NULL, 17, 9, NULL, NULL, 'exclusive', 1, NULL, '0265', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764726779_3009-var-1-68d2a745bc9bd.jpg', 659, NULL, 1, 660, 0, NULL, NULL, 0, 0, '2025-12-02 22:52:59', '2025-12-27 22:52:09'),
(266, 'Remera Tamia.Micro morley cuello en U', 1, 'variable', 1, NULL, NULL, 17, 1, NULL, NULL, 'exclusive', 1, NULL, '0266', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764726920_3067-m-8-68dc1e5b39be9.jpg', 661, NULL, 1, 662, 0, NULL, NULL, 0, 0, '2025-12-02 22:55:20', '2025-12-27 22:52:09'),
(267, 'Palazo Fiona.Hawaii ccordón tela y bolsillo', 1, 'variable', 1, NULL, NULL, 17, 2, NULL, NULL, 'exclusive', 1, NULL, '0267', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764727124_3048-3050-m-9-68a8aee4ab8a6-o.jpg', 663, NULL, 1, 664, 0, NULL, NULL, 0, 0, '2025-12-02 22:58:44', '2025-12-27 22:52:09'),
(268, 'Remera Pixie.Crepe viscosa costado fruncido', 1, 'variable', 1, NULL, NULL, 17, 1, NULL, NULL, 'exclusive', 1, NULL, '0268', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764727267_98c3eb563b3045e5949f8dce39398e79-68a88502c2c09-o.jpg', 665, NULL, 1, 666, 0, NULL, NULL, 0, 0, '2025-12-02 23:01:07', '2025-12-27 22:52:09'),
(269, 'Remera Fernie.Morley diesel básica con manga puño', 1, 'variable', 1, NULL, NULL, 17, 1, NULL, NULL, 'exclusive', 1, NULL, '0269', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764727399_3018-m-3-68715b13e4f42-o.jpg', 667, NULL, 1, 668, 0, NULL, NULL, 0, 0, '2025-12-02 23:03:19', '2025-12-27 22:52:09'),
(270, 'Remera Willow.Morley diesel básica', 1, 'variable', 1, NULL, NULL, 17, 1, NULL, NULL, 'exclusive', 1, NULL, '0270', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764727516_3017-m-7-68715529db2d7-o.jpg', 669, NULL, 1, 670, 0, NULL, NULL, 0, 0, '2025-12-02 23:05:16', '2025-12-27 22:52:09'),
(271, 'Remera Bell.Morley rayado con puño en manga', 1, 'variable', 1, NULL, NULL, 17, 1, NULL, NULL, 'exclusive', 1, NULL, '0271', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764727623_3001-m-6-687151c0bd0f7-o.jpg', 671, NULL, 1, 672, 0, NULL, NULL, 0, 0, '2025-12-02 23:07:03', '2025-12-27 22:52:09'),
(272, 'Remera (Modal) Mano de Dama', 1, 'variable', 1, NULL, NULL, 8, 1, NULL, NULL, 'exclusive', 1, NULL, '0272', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1764730895_mano-de-dama1-4d198f0efe8060eead16675926155760-1024-1024.webp', NULL, NULL, 1, 673, 0, NULL, NULL, 0, 0, '2025-12-03 00:01:35', '2025-12-27 22:52:09'),
(273, 'Musculosa Sacamander piedras', 1, 'single', 1, NULL, NULL, 10, 9, NULL, NULL, 'exclusive', 1, NULL, '0273', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1765026159_whatsapp-image-2025-11-05-at-12-33-27-7bcc0682688cfc73cb17623568873689-1024-1024.webp', NULL, NULL, 1, 674, 0, NULL, NULL, 0, 0, '2025-12-06 10:02:39', '2025-12-27 22:52:09'),
(274, 'Remera SHEILA bordada', 1, 'single', 1, NULL, NULL, 12, 1, NULL, NULL, 'exclusive', 1, NULL, '0274', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1765028498_lushka-9-a0671185f87107da5417588080351950-1024-1024.webp', NULL, NULL, 1, 675, 0, NULL, NULL, 0, 0, '2025-12-06 10:40:58', '2025-12-27 22:52:09'),
(275, 'Short Mubba Matizado', 1, 'variable', 1, NULL, NULL, 13, 4, NULL, NULL, 'exclusive', 1, NULL, '0275', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1765133942_whatsapp-image-2024-12-11-at-12-39-48-2-0143d3a7190ad6e25b17339410249459-640-0.webp', 37131, NULL, 1, 676, 0, NULL, NULL, 0, 0, '2025-12-07 18:59:02', '2026-01-03 18:56:38'),
(276, 'Short Allende conjunto', 1, 'variable', 1, NULL, NULL, 15, 4, NULL, NULL, 'exclusive', 1, NULL, '0276', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1765138025_remera-allende-conjunto-1.jpg', 677, NULL, 1, 678, 0, NULL, NULL, 0, 0, '2025-12-07 20:07:05', '2025-12-27 22:52:09'),
(277, 'Conjunto Palazzo y Puperon morley rayas finitas', 1, 'variable', 1, NULL, NULL, 2, 8, NULL, NULL, 'exclusive', 1, NULL, '0277', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1765138754_1761839069107-83794.png', 679, NULL, 1, 680, 0, NULL, NULL, 0, 0, '2025-12-07 20:19:14', '2025-12-27 22:52:09'),
(278, 'Curazao - Bermuda blanca con rotura', 1, 'variable', 1, NULL, NULL, 9, 23, NULL, NULL, 'exclusive', 1, NULL, '0278', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1766360158_ccj32-d1366beeb2a666553617633989344315-640-0.webp', NULL, NULL, 1, 681, 0, NULL, NULL, 0, 0, '2025-12-21 23:35:58', '2025-12-27 22:52:09'),
(279, 'Short animal print modal soft', 1, 'single', 1, NULL, NULL, 2, 4, NULL, NULL, 'exclusive', 1, NULL, '0279', 'C128', NULL, NULL, 0, NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1766366347_whatsapp-image-2025-12-21-at-221628.jpeg', 682, NULL, 1, 683, 0, NULL, NULL, 0, 0, '2025-12-22 01:15:51', '2025-12-27 22:52:09'),
(280, 'NUÑEZ - BERMUDA BAGGY CASCARILLA', 1, 'variable', 1, NULL, NULL, 9, 23, NULL, NULL, 'exclusive', 1, NULL, '0280', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1766766933_imagen39-1866239a41eb5fa98e17657217048946-640-0.webp', NULL, NULL, 1, 684, 0, NULL, NULL, 0, 0, '2025-12-26 16:35:33', '2025-12-27 22:52:09'),
(281, 'SAN AGUSTIN - BERMUDA NEGRO MARMOLADO', 1, 'variable', 1, NULL, NULL, 9, 23, NULL, NULL, 'exclusive', 1, NULL, '0281', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1766767037_imagen70-7cb52422592818856b17657203263129-640-0.webp', NULL, NULL, 1, 685, 0, NULL, NULL, 0, 0, '2025-12-26 16:37:18', '2025-12-27 22:52:09'),
(282, 'CHACABUCO BRILLOS - BERMUDA NEGRA CON STRASS NEGRO', 1, 'variable', 1, NULL, NULL, 9, 23, NULL, NULL, 'exclusive', 1, NULL, '0282', 'C128', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1766767255_whatsapp-image-2025-12-26-at-133840.jpeg', 686, NULL, 1, 687, 0, NULL, NULL, 0, 0, '2025-12-26 16:40:55', '2025-12-27 22:52:09');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `product_locations`
--

CREATE TABLE `product_locations` (
  `product_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `product_locations`
--

INSERT INTO `product_locations` (`product_id`, `location_id`) VALUES
(1, 1),
(2, 1),
(3, 1),
(4, 1),
(5, 1),
(6, 1),
(7, 1),
(8, 1),
(9, 1),
(10, 1),
(11, 1),
(12, 1),
(13, 1),
(14, 1),
(15, 1),
(16, 1),
(17, 1),
(18, 1),
(19, 1),
(20, 1),
(21, 1),
(22, 1),
(23, 1),
(24, 1),
(25, 1),
(26, 1),
(27, 1),
(28, 1),
(29, 1),
(30, 1),
(31, 1),
(32, 1),
(33, 1),
(34, 1),
(35, 1),
(36, 1),
(37, 1),
(38, 1),
(39, 1),
(40, 1),
(41, 1),
(42, 1),
(43, 1),
(44, 1),
(45, 1),
(46, 1),
(47, 1),
(48, 1),
(49, 1),
(50, 1),
(51, 1),
(52, 1),
(53, 1),
(54, 1),
(55, 1),
(56, 1),
(57, 1),
(58, 1),
(59, 1),
(60, 1),
(61, 1),
(62, 1),
(63, 1),
(64, 1),
(65, 1),
(66, 1),
(67, 1),
(68, 1),
(69, 1),
(70, 1),
(71, 1),
(72, 1),
(73, 1),
(74, 1),
(75, 1),
(76, 1),
(77, 1),
(78, 1),
(79, 1),
(80, 1),
(81, 1),
(82, 1),
(83, 1),
(84, 1),
(85, 1),
(86, 1),
(87, 1),
(88, 1),
(89, 1),
(90, 1),
(91, 1),
(92, 1),
(93, 1),
(94, 1),
(95, 1),
(96, 1),
(97, 1),
(98, 1),
(99, 1),
(100, 1),
(101, 1),
(102, 1),
(103, 1),
(104, 1),
(105, 1),
(106, 1),
(107, 1),
(108, 1),
(109, 1),
(110, 1),
(111, 1),
(112, 1),
(113, 1),
(114, 1),
(115, 1),
(116, 1),
(117, 1),
(118, 1),
(119, 1),
(120, 1),
(121, 1),
(122, 1),
(123, 1),
(124, 1),
(125, 1),
(126, 1),
(127, 1),
(128, 1),
(129, 1),
(130, 1),
(131, 1),
(132, 1),
(133, 1),
(134, 1),
(135, 1),
(136, 1),
(137, 1),
(138, 1),
(139, 1),
(140, 1),
(141, 1),
(142, 1),
(143, 1),
(144, 1),
(145, 1),
(146, 1),
(147, 1),
(148, 1),
(149, 1),
(150, 1),
(151, 1),
(152, 1),
(153, 1),
(154, 1),
(155, 1),
(156, 1),
(157, 1),
(158, 1),
(159, 1),
(160, 1),
(161, 1),
(162, 1),
(163, 1),
(164, 1),
(165, 1),
(166, 1),
(167, 1),
(168, 1),
(169, 1),
(170, 1),
(171, 1),
(172, 1),
(173, 1),
(174, 1),
(175, 1),
(176, 1),
(177, 1),
(178, 1),
(179, 1),
(180, 1),
(181, 1),
(182, 1),
(183, 1),
(184, 1),
(185, 1),
(186, 1),
(187, 1),
(188, 1),
(189, 1),
(190, 1),
(191, 1),
(192, 1),
(193, 1),
(194, 1),
(195, 1),
(196, 1),
(197, 1),
(198, 1),
(199, 1),
(200, 1),
(201, 1),
(202, 1),
(203, 1),
(204, 1),
(205, 1),
(206, 1),
(207, 1),
(208, 1),
(209, 1),
(210, 1),
(211, 1),
(212, 1),
(213, 1),
(214, 1),
(215, 1),
(216, 1),
(217, 1),
(218, 1),
(219, 1),
(220, 1),
(221, 1),
(222, 1),
(223, 1),
(224, 1),
(225, 1),
(226, 1),
(227, 1),
(228, 1),
(229, 1),
(230, 1),
(231, 1),
(232, 1),
(233, 1),
(234, 1),
(235, 1),
(236, 1),
(237, 1),
(238, 1),
(239, 1),
(240, 1),
(241, 1),
(242, 1),
(243, 1),
(244, 1),
(245, 1),
(246, 1),
(247, 1),
(248, 1),
(249, 1),
(250, 1),
(251, 1),
(252, 1),
(253, 1),
(254, 1),
(255, 1),
(256, 1),
(257, 1),
(258, 1),
(259, 1),
(260, 1),
(261, 1),
(262, 1),
(263, 1),
(264, 1),
(265, 1),
(266, 1),
(267, 1),
(268, 1),
(269, 1),
(270, 1),
(271, 1),
(272, 1),
(273, 1),
(274, 1),
(275, 1),
(276, 1),
(277, 1),
(278, 1),
(279, 1),
(280, 1),
(281, 1),
(282, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `product_racks`
--

CREATE TABLE `product_racks` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `location_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `rack` varchar(191) DEFAULT NULL,
  `row` varchar(191) DEFAULT NULL,
  `position` varchar(191) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `product_racks`
--

INSERT INTO `product_racks` (`id`, `business_id`, `location_id`, `product_id`, `rack`, `row`, `position`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 4, NULL, NULL, NULL, '2025-11-15 19:23:36', '2025-11-15 19:23:36'),
(2, 1, 1, 5, NULL, NULL, NULL, '2025-11-15 19:26:09', '2025-11-15 19:26:09'),
(3, 1, 1, 6, NULL, NULL, NULL, '2025-11-15 19:28:40', '2025-11-15 19:29:56'),
(4, 1, 1, 7, NULL, NULL, NULL, '2025-11-15 19:31:19', '2025-11-15 19:32:42'),
(5, 1, 1, 8, NULL, NULL, NULL, '2025-11-15 19:33:17', '2025-11-15 19:33:17'),
(6, 1, 1, 9, NULL, NULL, NULL, '2025-11-15 19:36:40', '2025-11-15 19:37:02'),
(7, 1, 1, 10, NULL, NULL, NULL, '2025-11-15 19:38:22', '2025-11-15 19:38:22'),
(8, 1, 1, 11, NULL, NULL, NULL, '2025-11-15 19:40:35', '2025-11-15 19:40:35'),
(9, 1, 1, 12, NULL, NULL, NULL, '2025-11-15 19:51:29', '2025-11-15 19:51:29'),
(10, 1, 1, 13, NULL, NULL, NULL, '2025-11-15 20:02:19', '2025-11-15 20:02:19'),
(11, 1, 1, 14, NULL, NULL, NULL, '2025-11-15 20:03:15', '2025-11-15 20:03:15'),
(12, 1, 1, 15, NULL, NULL, NULL, '2025-11-15 20:18:22', '2025-11-15 20:18:22'),
(13, 1, 1, 16, NULL, NULL, NULL, '2025-11-15 20:24:09', '2025-11-15 20:24:09'),
(14, 1, 1, 17, NULL, NULL, NULL, '2025-11-15 20:27:44', '2025-11-15 20:27:44'),
(15, 1, 1, 18, NULL, NULL, NULL, '2025-11-15 20:31:08', '2025-11-15 20:31:08'),
(16, 1, 1, 19, NULL, NULL, NULL, '2025-11-15 20:33:58', '2025-11-15 20:33:58'),
(17, 1, 1, 20, NULL, NULL, NULL, '2025-11-15 20:37:39', '2025-11-15 20:37:39'),
(18, 1, 1, 21, NULL, NULL, NULL, '2025-11-15 21:32:42', '2025-11-15 21:32:42'),
(19, 1, 1, 22, NULL, NULL, NULL, '2025-11-15 21:54:27', '2025-11-15 21:54:27'),
(20, 1, 1, 23, NULL, NULL, NULL, '2025-11-15 21:56:07', '2025-11-15 21:56:07'),
(21, 1, 1, 24, NULL, NULL, NULL, '2025-11-15 22:01:02', '2025-11-15 22:01:02'),
(22, 1, 1, 25, NULL, NULL, NULL, '2025-11-15 22:02:22', '2025-11-15 22:02:22'),
(23, 1, 1, 26, NULL, NULL, NULL, '2025-11-15 22:03:32', '2025-11-15 22:03:32'),
(24, 1, 1, 27, NULL, NULL, NULL, '2025-11-15 22:04:39', '2025-11-15 22:04:39'),
(25, 1, 1, 28, NULL, NULL, NULL, '2025-11-15 22:05:54', '2025-11-15 22:05:54'),
(26, 1, 1, 29, NULL, NULL, NULL, '2025-11-15 22:06:54', '2025-11-15 22:06:54'),
(27, 1, 1, 30, NULL, NULL, NULL, '2025-11-15 22:10:39', '2025-11-15 22:10:39'),
(28, 1, 1, 31, NULL, NULL, NULL, '2025-11-15 22:36:29', '2025-11-15 22:36:29'),
(29, 1, 1, 32, NULL, NULL, NULL, '2025-11-15 22:37:30', '2025-11-15 22:37:30'),
(30, 1, 1, 33, NULL, NULL, NULL, '2025-11-15 22:39:02', '2025-11-15 22:39:02'),
(31, 1, 1, 34, NULL, NULL, NULL, '2025-11-15 22:40:54', '2025-11-15 22:40:54'),
(32, 1, 1, 35, NULL, NULL, NULL, '2025-11-15 22:42:05', '2025-11-15 22:42:05'),
(33, 1, 1, 36, NULL, NULL, NULL, '2025-11-15 22:43:34', '2025-11-15 22:43:34'),
(34, 1, 1, 37, NULL, NULL, NULL, '2025-11-15 22:44:46', '2025-11-15 22:44:46'),
(35, 1, 1, 38, NULL, NULL, NULL, '2025-11-15 22:45:50', '2025-11-15 22:45:50'),
(36, 1, 1, 39, NULL, NULL, NULL, '2025-11-15 22:46:35', '2025-11-15 22:46:35'),
(37, 1, 1, 40, NULL, NULL, NULL, '2025-11-24 12:45:06', '2025-11-24 12:45:06'),
(38, 1, 1, 41, NULL, NULL, NULL, '2025-11-24 12:48:54', '2025-11-24 12:48:54'),
(39, 1, 1, 42, NULL, NULL, NULL, '2025-11-24 12:51:30', '2025-11-24 12:51:30'),
(40, 1, 1, 43, NULL, NULL, NULL, '2025-11-24 12:52:39', '2025-11-24 12:52:39'),
(41, 1, 1, 44, NULL, NULL, NULL, '2025-11-24 12:59:57', '2025-11-24 12:59:57'),
(42, 1, 1, 45, NULL, NULL, NULL, '2025-11-24 13:06:14', '2025-11-24 13:06:14'),
(43, 1, 1, 46, NULL, NULL, NULL, '2025-11-24 13:07:48', '2025-11-24 13:07:48'),
(44, 1, 1, 47, NULL, NULL, NULL, '2025-11-24 13:09:18', '2025-11-24 13:09:18'),
(45, 1, 1, 48, NULL, NULL, NULL, '2025-11-24 13:11:05', '2025-11-24 13:11:05'),
(46, 1, 1, 49, NULL, NULL, NULL, '2025-11-24 13:12:47', '2025-11-24 13:12:47'),
(47, 1, 1, 50, NULL, NULL, NULL, '2025-11-24 13:15:24', '2025-11-24 13:15:24'),
(48, 1, 1, 51, NULL, NULL, NULL, '2025-11-24 13:41:16', '2025-11-24 13:41:16'),
(49, 1, 1, 52, NULL, NULL, NULL, '2025-11-24 13:54:29', '2025-11-24 13:54:29'),
(50, 1, 1, 53, NULL, NULL, NULL, '2025-11-24 13:56:29', '2025-11-24 13:56:29'),
(51, 1, 1, 54, NULL, NULL, NULL, '2025-11-24 13:59:50', '2025-11-24 13:59:50'),
(52, 1, 1, 55, NULL, NULL, NULL, '2025-11-24 14:01:24', '2025-11-24 14:01:24'),
(53, 1, 1, 56, NULL, NULL, NULL, '2025-11-24 14:04:43', '2025-11-24 14:04:43'),
(54, 1, 1, 57, NULL, NULL, NULL, '2025-11-24 14:11:15', '2025-11-24 14:11:15'),
(55, 1, 1, 58, NULL, NULL, NULL, '2025-11-24 14:11:53', '2025-11-24 14:11:53'),
(56, 1, 1, 59, NULL, NULL, NULL, '2025-11-24 14:15:57', '2025-11-24 14:15:57'),
(57, 1, 1, 60, NULL, NULL, NULL, '2025-11-24 14:17:39', '2025-11-24 14:17:39'),
(58, 1, 1, 61, NULL, NULL, NULL, '2025-11-24 14:24:54', '2025-11-24 14:24:54'),
(59, 1, 1, 62, NULL, NULL, NULL, '2025-11-24 15:04:17', '2025-11-24 15:04:17'),
(60, 1, 1, 63, NULL, NULL, NULL, '2025-11-24 15:05:48', '2025-11-24 15:05:48'),
(61, 1, 1, 64, NULL, NULL, NULL, '2025-11-24 15:06:55', '2025-11-24 15:06:55'),
(62, 1, 1, 65, NULL, NULL, NULL, '2025-11-24 15:09:23', '2025-11-24 15:09:23'),
(63, 1, 1, 66, NULL, NULL, NULL, '2025-11-24 15:12:41', '2025-11-24 15:12:41'),
(64, 1, 1, 67, NULL, NULL, NULL, '2025-11-24 15:46:42', '2025-11-24 15:46:42'),
(65, 1, 1, 68, NULL, NULL, NULL, '2025-11-24 15:49:22', '2025-11-24 15:49:22'),
(66, 1, 1, 69, NULL, NULL, NULL, '2025-11-24 15:52:14', '2025-11-24 15:52:14'),
(67, 1, 1, 70, NULL, NULL, NULL, '2025-11-24 15:56:06', '2025-11-24 15:56:06'),
(68, 1, 1, 71, NULL, NULL, NULL, '2025-11-24 15:59:23', '2025-11-24 15:59:41'),
(69, 1, 1, 72, NULL, NULL, NULL, '2025-11-24 16:03:24', '2025-11-24 16:03:24'),
(70, 1, 1, 73, NULL, NULL, NULL, '2025-11-24 16:08:07', '2025-12-27 23:16:07'),
(71, 1, 1, 74, NULL, NULL, NULL, '2025-11-24 16:14:35', '2025-11-24 16:14:35'),
(72, 1, 1, 75, NULL, NULL, NULL, '2025-11-24 16:21:39', '2025-11-24 16:21:39'),
(73, 1, 1, 76, NULL, NULL, NULL, '2025-11-24 16:26:00', '2025-11-24 16:26:00'),
(74, 1, 1, 77, NULL, NULL, NULL, '2025-11-24 16:29:13', '2025-11-24 16:29:13'),
(75, 1, 1, 78, NULL, NULL, NULL, '2025-11-24 16:31:21', '2025-11-24 16:31:21'),
(76, 1, 1, 79, NULL, NULL, NULL, '2025-11-24 16:34:58', '2025-11-24 16:34:58'),
(77, 1, 1, 80, NULL, NULL, NULL, '2025-11-24 16:37:22', '2025-11-24 16:37:22'),
(78, 1, 1, 81, NULL, NULL, NULL, '2025-11-24 16:40:20', '2025-11-24 16:40:20'),
(79, 1, 1, 82, NULL, NULL, NULL, '2025-11-24 16:43:29', '2025-11-24 16:43:29'),
(80, 1, 1, 83, NULL, NULL, NULL, '2025-11-24 16:47:57', '2025-11-24 16:47:57'),
(81, 1, 1, 84, NULL, NULL, NULL, '2025-11-24 16:50:03', '2025-11-24 16:50:03'),
(82, 1, 1, 85, NULL, NULL, NULL, '2025-11-24 16:52:19', '2025-11-24 16:52:19'),
(83, 1, 1, 86, NULL, NULL, NULL, '2025-11-24 16:54:33', '2025-11-24 16:54:33'),
(84, 1, 1, 87, NULL, NULL, NULL, '2025-11-24 16:56:13', '2025-11-24 16:56:13'),
(85, 1, 1, 88, NULL, NULL, NULL, '2025-11-24 16:58:04', '2025-11-24 16:58:04'),
(86, 1, 1, 89, NULL, NULL, NULL, '2025-11-24 17:00:18', '2025-11-24 17:00:18'),
(87, 1, 1, 90, NULL, NULL, NULL, '2025-11-24 17:02:35', '2025-11-24 17:02:35'),
(88, 1, 1, 91, NULL, NULL, NULL, '2025-11-24 17:06:12', '2025-11-24 17:06:12'),
(89, 1, 1, 92, NULL, NULL, NULL, '2025-11-24 17:09:41', '2025-11-24 17:09:41'),
(90, 1, 1, 93, NULL, NULL, NULL, '2025-11-24 17:13:26', '2025-11-24 17:13:26'),
(91, 1, 1, 94, NULL, NULL, NULL, '2025-11-24 17:17:28', '2025-11-24 17:17:28'),
(92, 1, 1, 95, NULL, NULL, NULL, '2025-11-24 17:19:56', '2025-11-24 17:19:56'),
(93, 1, 1, 96, NULL, NULL, NULL, '2025-11-24 17:27:54', '2025-12-03 22:12:02'),
(94, 1, 1, 97, NULL, NULL, NULL, '2025-11-24 17:29:36', '2025-11-24 17:29:36'),
(95, 1, 1, 98, NULL, NULL, NULL, '2025-11-24 17:31:28', '2025-11-24 17:31:28'),
(96, 1, 1, 99, NULL, NULL, NULL, '2025-11-24 17:33:25', '2025-11-24 17:33:25'),
(97, 1, 1, 100, NULL, NULL, NULL, '2025-11-24 17:47:19', '2025-11-24 17:47:19'),
(98, 1, 1, 101, NULL, NULL, NULL, '2025-11-24 17:50:10', '2025-11-24 17:50:10'),
(99, 1, 1, 102, NULL, NULL, NULL, '2025-11-24 17:52:14', '2025-11-24 17:52:14'),
(100, 1, 1, 103, NULL, NULL, NULL, '2025-11-24 17:54:11', '2025-11-24 17:54:11'),
(101, 1, 1, 104, NULL, NULL, NULL, '2025-11-24 17:56:12', '2025-11-24 17:56:12'),
(102, 1, 1, 105, NULL, NULL, NULL, '2025-11-24 17:58:50', '2025-11-24 17:58:50'),
(103, 1, 1, 106, NULL, NULL, NULL, '2025-11-24 18:01:10', '2025-11-24 18:01:10'),
(104, 1, 1, 107, NULL, NULL, NULL, '2025-11-24 18:04:04', '2025-12-02 23:59:41'),
(105, 1, 1, 108, NULL, NULL, NULL, '2025-11-24 18:07:29', '2025-11-24 18:07:29'),
(106, 1, 1, 109, NULL, NULL, NULL, '2025-11-24 18:10:02', '2025-11-24 18:10:02'),
(107, 1, 1, 110, NULL, NULL, NULL, '2025-11-24 18:16:13', '2025-11-24 18:16:13'),
(108, 1, 1, 111, NULL, NULL, NULL, '2025-11-24 18:17:59', '2025-11-24 18:17:59'),
(109, 1, 1, 112, NULL, NULL, NULL, '2025-11-24 18:19:44', '2025-11-24 18:19:44'),
(110, 1, 1, 113, NULL, NULL, NULL, '2025-11-24 18:24:21', '2025-11-24 18:24:21'),
(111, 1, 1, 114, NULL, NULL, NULL, '2025-11-24 19:01:58', '2025-11-24 19:01:58'),
(112, 1, 1, 115, NULL, NULL, NULL, '2025-11-24 19:03:42', '2025-11-24 19:03:42'),
(113, 1, 1, 116, NULL, NULL, NULL, '2025-11-24 19:05:07', '2025-11-24 19:05:07'),
(114, 1, 1, 117, NULL, NULL, NULL, '2025-11-24 19:17:04', '2025-11-24 19:17:04'),
(115, 1, 1, 118, NULL, NULL, NULL, '2025-11-24 19:20:25', '2025-11-24 19:20:25'),
(116, 1, 1, 119, NULL, NULL, NULL, '2025-11-24 19:23:30', '2025-11-24 19:23:30'),
(117, 1, 1, 120, NULL, NULL, NULL, '2025-11-24 19:26:06', '2025-11-24 19:26:06'),
(118, 1, 1, 121, NULL, NULL, NULL, '2025-11-24 19:28:46', '2025-11-24 19:28:46'),
(119, 1, 1, 122, NULL, NULL, NULL, '2025-11-24 19:32:07', '2025-11-24 19:32:07'),
(120, 1, 1, 123, NULL, NULL, NULL, '2025-11-24 20:00:33', '2025-11-24 20:00:33'),
(121, 1, 1, 124, NULL, NULL, NULL, '2025-11-24 20:03:45', '2025-11-24 20:03:45'),
(122, 1, 1, 125, NULL, NULL, NULL, '2025-11-24 20:06:37', '2025-11-24 20:06:37'),
(123, 1, 1, 126, NULL, NULL, NULL, '2025-11-24 20:09:20', '2025-11-24 20:09:20'),
(124, 1, 1, 127, NULL, NULL, NULL, '2025-11-24 20:11:53', '2025-11-24 20:11:53'),
(125, 1, 1, 128, NULL, NULL, NULL, '2025-11-24 20:15:02', '2025-11-24 20:15:02'),
(126, 1, 1, 129, NULL, NULL, NULL, '2025-11-24 20:18:04', '2025-11-24 20:18:04'),
(127, 1, 1, 130, NULL, NULL, NULL, '2025-11-24 20:20:55', '2025-11-24 20:20:55'),
(128, 1, 1, 131, NULL, NULL, NULL, '2025-11-24 20:23:36', '2025-11-24 20:23:36'),
(129, 1, 1, 132, NULL, NULL, NULL, '2025-11-24 20:30:26', '2025-11-24 20:30:26'),
(130, 1, 1, 133, NULL, NULL, NULL, '2025-11-24 20:32:47', '2025-11-24 20:32:47'),
(131, 1, 1, 134, NULL, NULL, NULL, '2025-11-24 20:36:53', '2025-11-24 20:36:53'),
(132, 1, 1, 135, NULL, NULL, NULL, '2025-11-24 20:40:16', '2025-11-24 20:40:16'),
(133, 1, 1, 136, NULL, NULL, NULL, '2025-11-24 20:45:23', '2025-11-24 20:45:23'),
(134, 1, 1, 137, NULL, NULL, NULL, '2025-11-24 20:47:18', '2025-12-06 09:59:46'),
(135, 1, 1, 138, NULL, NULL, NULL, '2025-11-24 20:48:54', '2025-11-24 20:48:54'),
(136, 1, 1, 139, NULL, NULL, NULL, '2025-11-24 20:51:00', '2025-11-24 20:51:00'),
(137, 1, 1, 140, NULL, NULL, NULL, '2025-11-24 20:54:53', '2025-11-24 20:54:53'),
(138, 1, 1, 141, NULL, NULL, NULL, '2025-11-24 20:56:58', '2025-11-24 20:56:58'),
(139, 1, 1, 142, NULL, NULL, NULL, '2025-11-24 20:59:11', '2025-11-24 20:59:11'),
(140, 1, 1, 143, NULL, NULL, NULL, '2025-11-24 21:00:51', '2025-11-24 21:00:51'),
(141, 1, 1, 144, NULL, NULL, NULL, '2025-11-24 21:02:59', '2025-11-24 21:02:59'),
(142, 1, 1, 145, NULL, NULL, NULL, '2025-11-24 21:04:47', '2025-11-24 21:04:47'),
(143, 1, 1, 146, NULL, NULL, NULL, '2025-11-25 21:49:46', '2025-11-25 21:49:46'),
(144, 1, 1, 147, NULL, NULL, NULL, '2025-11-25 21:53:17', '2025-11-25 21:53:17'),
(145, 1, 1, 148, NULL, NULL, NULL, '2025-11-25 21:56:42', '2025-11-25 21:56:42'),
(146, 1, 1, 149, NULL, NULL, NULL, '2025-11-25 21:58:44', '2025-11-25 21:58:44'),
(147, 1, 1, 150, NULL, NULL, NULL, '2025-11-25 22:01:15', '2025-11-25 22:01:15'),
(148, 1, 1, 151, NULL, NULL, NULL, '2025-11-25 22:03:45', '2025-12-28 18:31:29'),
(149, 1, 1, 152, NULL, NULL, NULL, '2025-11-25 22:06:01', '2025-11-25 22:06:01'),
(150, 1, 1, 153, NULL, NULL, NULL, '2025-11-25 22:07:44', '2025-11-25 22:07:44'),
(151, 1, 1, 154, NULL, NULL, NULL, '2025-11-25 22:09:55', '2025-11-25 22:09:55'),
(152, 1, 1, 155, NULL, NULL, NULL, '2025-11-25 22:13:07', '2025-11-25 22:13:07'),
(153, 1, 1, 156, NULL, NULL, NULL, '2025-11-25 22:15:09', '2025-11-25 22:15:09'),
(154, 1, 1, 157, NULL, NULL, NULL, '2025-11-25 22:17:20', '2025-11-25 22:17:20'),
(155, 1, 1, 158, NULL, NULL, NULL, '2025-11-25 22:18:57', '2025-11-25 22:18:57'),
(156, 1, 1, 159, NULL, NULL, NULL, '2025-11-25 22:20:51', '2025-11-25 22:20:51'),
(157, 1, 1, 160, NULL, NULL, NULL, '2025-11-25 22:23:18', '2025-11-25 22:23:18'),
(158, 1, 1, 161, NULL, NULL, NULL, '2025-11-25 22:25:39', '2025-11-25 22:25:39'),
(159, 1, 1, 162, NULL, NULL, NULL, '2025-11-25 22:28:42', '2025-11-25 22:28:42'),
(160, 1, 1, 163, NULL, NULL, NULL, '2025-11-25 22:34:11', '2025-11-25 22:34:11'),
(161, 1, 1, 164, NULL, NULL, NULL, '2025-11-25 22:36:08', '2025-11-25 22:36:08'),
(162, 1, 1, 165, NULL, NULL, NULL, '2025-11-25 22:40:31', '2025-11-25 22:40:31'),
(163, 1, 1, 166, NULL, NULL, NULL, '2025-11-25 22:46:44', '2025-11-25 22:46:44'),
(164, 1, 1, 167, NULL, NULL, NULL, '2025-11-25 22:48:55', '2025-11-25 22:48:55'),
(165, 1, 1, 168, NULL, NULL, NULL, '2025-11-25 23:02:13', '2025-11-25 23:02:13'),
(166, 1, 1, 169, NULL, NULL, NULL, '2025-11-26 20:09:54', '2025-11-26 20:09:54'),
(167, 1, 1, 170, NULL, NULL, NULL, '2025-11-26 20:14:00', '2025-11-26 20:14:00'),
(168, 1, 1, 171, NULL, NULL, NULL, '2025-11-26 20:18:16', '2025-11-26 20:18:16'),
(169, 1, 1, 172, NULL, NULL, NULL, '2025-11-26 20:20:15', '2025-11-26 20:20:15'),
(170, 1, 1, 173, NULL, NULL, NULL, '2025-11-26 20:22:22', '2025-11-26 20:22:22'),
(171, 1, 1, 174, NULL, NULL, NULL, '2025-11-26 20:30:15', '2025-11-26 20:30:15'),
(172, 1, 1, 175, NULL, NULL, NULL, '2025-11-26 20:39:12', '2025-11-26 20:39:12'),
(173, 1, 1, 176, NULL, NULL, NULL, '2025-11-26 20:41:20', '2025-11-26 20:41:20'),
(174, 1, 1, 177, NULL, NULL, NULL, '2025-11-26 20:45:05', '2025-11-30 15:58:50'),
(175, 1, 1, 178, NULL, NULL, NULL, '2025-11-26 20:47:15', '2025-11-26 20:47:15'),
(176, 1, 1, 179, NULL, NULL, NULL, '2025-11-26 20:49:40', '2025-11-26 20:49:40'),
(177, 1, 1, 180, NULL, NULL, NULL, '2025-11-26 20:51:53', '2025-11-26 20:51:53'),
(178, 1, 1, 181, NULL, NULL, NULL, '2025-11-26 20:55:13', '2025-11-26 20:55:13'),
(179, 1, 1, 182, NULL, NULL, NULL, '2025-11-26 21:10:57', '2025-11-26 21:10:57'),
(180, 1, 1, 183, NULL, NULL, NULL, '2025-11-26 21:17:58', '2025-11-26 21:46:43'),
(181, 1, 1, 184, NULL, NULL, NULL, '2025-11-26 21:20:18', '2025-11-26 21:20:18'),
(182, 1, 1, 185, NULL, NULL, NULL, '2025-11-26 21:22:25', '2025-11-26 21:22:25'),
(183, 1, 1, 186, NULL, NULL, NULL, '2025-11-26 21:24:17', '2025-11-26 21:24:17'),
(184, 1, 1, 187, NULL, NULL, NULL, '2025-11-26 21:26:33', '2025-11-26 21:26:33'),
(185, 1, 1, 188, NULL, NULL, NULL, '2025-11-26 21:29:35', '2025-11-26 21:29:35'),
(186, 1, 1, 189, NULL, NULL, NULL, '2025-11-26 21:31:56', '2025-12-08 20:33:09'),
(187, 1, 1, 190, NULL, NULL, NULL, '2025-11-26 21:34:26', '2025-11-26 21:34:26'),
(188, 1, 1, 191, NULL, NULL, NULL, '2025-11-26 21:55:20', '2025-11-26 21:55:20'),
(189, 1, 1, 192, NULL, NULL, NULL, '2025-11-30 15:41:26', '2025-11-30 15:41:26'),
(190, 1, 1, 193, NULL, NULL, NULL, '2025-11-30 15:43:41', '2025-11-30 15:43:41'),
(191, 1, 1, 194, NULL, NULL, NULL, '2025-11-30 15:52:23', '2025-11-30 15:52:23'),
(192, 1, 1, 195, NULL, NULL, NULL, '2025-11-30 15:55:10', '2025-12-28 18:33:50'),
(193, 1, 1, 196, NULL, NULL, NULL, '2025-11-30 15:57:52', '2025-11-30 15:57:52'),
(194, 1, 1, 197, NULL, NULL, NULL, '2025-11-30 16:01:21', '2025-11-30 16:01:21'),
(195, 1, 1, 198, NULL, NULL, NULL, '2025-11-30 16:03:40', '2025-11-30 16:03:40'),
(196, 1, 1, 199, NULL, NULL, NULL, '2025-11-30 16:07:34', '2025-11-30 16:07:34'),
(197, 1, 1, 200, NULL, NULL, NULL, '2025-11-30 16:14:06', '2025-11-30 16:14:06'),
(198, 1, 1, 201, NULL, NULL, NULL, '2025-11-30 16:18:08', '2025-11-30 16:18:08'),
(199, 1, 1, 202, NULL, NULL, NULL, '2025-11-30 16:22:04', '2025-11-30 16:22:04'),
(200, 1, 1, 203, NULL, NULL, NULL, '2025-11-30 16:25:19', '2025-11-30 16:25:19'),
(201, 1, 1, 204, NULL, NULL, NULL, '2025-11-30 16:29:26', '2025-11-30 16:29:26'),
(202, 1, 1, 205, NULL, NULL, NULL, '2025-11-30 16:36:17', '2025-11-30 16:37:40'),
(203, 1, 1, 206, NULL, NULL, NULL, '2025-11-30 16:44:08', '2025-11-30 16:44:08'),
(204, 1, 1, 207, NULL, NULL, NULL, '2025-11-30 16:46:41', '2025-11-30 16:46:41'),
(205, 1, 1, 208, NULL, NULL, NULL, '2025-11-30 16:51:02', '2025-11-30 16:51:02'),
(206, 1, 1, 209, NULL, NULL, NULL, '2025-11-30 16:56:44', '2025-11-30 16:56:44'),
(207, 1, 1, 210, NULL, NULL, NULL, '2025-11-30 17:02:27', '2025-11-30 17:02:27'),
(208, 1, 1, 211, NULL, NULL, NULL, '2025-11-30 17:08:56', '2025-11-30 17:08:56'),
(209, 1, 1, 212, NULL, NULL, NULL, '2025-11-30 17:13:24', '2025-11-30 17:13:24'),
(210, 1, 1, 213, NULL, NULL, NULL, '2025-11-30 17:16:43', '2025-11-30 17:16:43'),
(211, 1, 1, 214, NULL, NULL, NULL, '2025-11-30 17:19:38', '2025-11-30 17:19:38'),
(212, 1, 1, 215, NULL, NULL, NULL, '2025-11-30 17:21:30', '2025-11-30 17:21:30'),
(213, 1, 1, 216, NULL, NULL, NULL, '2025-11-30 17:23:56', '2025-11-30 17:23:56'),
(214, 1, 1, 217, NULL, NULL, NULL, '2025-11-30 17:27:04', '2025-11-30 17:27:04'),
(215, 1, 1, 218, NULL, NULL, NULL, '2025-11-30 17:31:09', '2025-11-30 17:31:09'),
(216, 1, 1, 219, NULL, NULL, NULL, '2025-11-30 17:35:22', '2025-11-30 17:35:22'),
(217, 1, 1, 220, NULL, NULL, NULL, '2025-11-30 17:37:32', '2025-11-30 17:37:32'),
(218, 1, 1, 221, NULL, NULL, NULL, '2025-11-30 17:39:38', '2025-11-30 17:39:38'),
(219, 1, 1, 222, NULL, NULL, NULL, '2025-11-30 17:44:54', '2025-11-30 17:44:54'),
(220, 1, 1, 223, NULL, NULL, NULL, '2025-11-30 17:48:42', '2025-11-30 17:48:42'),
(221, 1, 1, 224, NULL, NULL, NULL, '2025-11-30 17:51:13', '2025-11-30 17:51:13'),
(222, 1, 1, 225, NULL, NULL, NULL, '2025-11-30 17:56:49', '2025-11-30 17:56:49'),
(223, 1, 1, 226, NULL, NULL, NULL, '2025-11-30 18:01:26', '2025-11-30 18:01:26'),
(224, 1, 1, 227, NULL, NULL, NULL, '2025-11-30 18:03:52', '2025-11-30 18:03:52'),
(225, 1, 1, 228, NULL, NULL, NULL, '2025-11-30 18:06:01', '2025-11-30 18:06:01'),
(226, 1, 1, 229, NULL, NULL, NULL, '2025-11-30 18:08:04', '2025-11-30 18:08:04'),
(227, 1, 1, 230, NULL, NULL, NULL, '2025-11-30 18:22:48', '2025-11-30 18:30:18'),
(228, 1, 1, 231, NULL, NULL, NULL, '2025-11-30 18:32:04', '2025-11-30 18:32:04'),
(229, 1, 1, 232, NULL, NULL, NULL, '2025-11-30 18:35:12', '2025-11-30 18:35:12'),
(230, 1, 1, 233, NULL, NULL, NULL, '2025-11-30 18:36:50', '2025-11-30 18:36:50'),
(231, 1, 1, 234, NULL, NULL, NULL, '2025-11-30 18:39:31', '2025-11-30 18:39:31'),
(232, 1, 1, 235, NULL, NULL, NULL, '2025-11-30 18:44:23', '2025-11-30 18:44:23'),
(233, 1, 1, 236, NULL, NULL, NULL, '2025-11-30 18:51:16', '2025-11-30 18:51:16'),
(234, 1, 1, 237, NULL, NULL, NULL, '2025-11-30 19:03:02', '2025-11-30 19:07:54'),
(235, 1, 1, 238, NULL, NULL, NULL, '2025-11-30 19:09:54', '2025-11-30 19:09:54'),
(236, 1, 1, 239, NULL, NULL, NULL, '2025-11-30 21:48:43', '2025-12-30 01:43:46'),
(237, 1, 1, 240, NULL, NULL, NULL, '2025-11-30 21:54:50', '2025-11-30 21:54:50'),
(238, 1, 1, 241, NULL, NULL, NULL, '2025-11-30 22:01:45', '2025-12-22 01:34:08'),
(239, 1, 1, 242, NULL, NULL, NULL, '2025-11-30 22:04:49', '2025-11-30 22:04:49'),
(240, 1, 1, 243, NULL, NULL, NULL, '2025-11-30 22:08:43', '2025-11-30 22:08:43'),
(241, 1, 1, 244, NULL, NULL, NULL, '2025-11-30 22:12:05', '2025-11-30 22:12:05'),
(242, 1, 1, 245, NULL, NULL, NULL, '2025-11-30 22:14:19', '2025-11-30 22:14:19'),
(243, 1, 1, 246, NULL, NULL, NULL, '2025-11-30 22:17:06', '2025-11-30 22:17:06'),
(244, 1, 1, 247, NULL, NULL, NULL, '2025-12-01 22:18:46', '2025-12-01 22:18:46'),
(245, 1, 1, 248, NULL, NULL, NULL, '2025-12-01 22:20:40', '2025-12-01 22:20:40'),
(246, 1, 1, 249, NULL, NULL, NULL, '2025-12-01 22:22:56', '2025-12-01 22:22:56'),
(247, 1, 1, 250, NULL, NULL, NULL, '2025-12-01 22:25:44', '2025-12-22 02:15:54'),
(248, 1, 1, 251, NULL, NULL, NULL, '2025-12-01 22:28:10', '2025-12-01 22:28:10'),
(249, 1, 1, 252, NULL, NULL, NULL, '2025-12-01 22:30:13', '2025-12-01 22:30:13'),
(250, 1, 1, 253, NULL, NULL, NULL, '2025-12-01 22:32:21', '2025-12-01 22:32:21'),
(251, 1, 1, 254, NULL, NULL, NULL, '2025-12-01 22:34:26', '2025-12-01 22:34:26'),
(252, 1, 1, 255, NULL, NULL, NULL, '2025-12-01 22:36:23', '2025-12-01 22:36:23'),
(253, 1, 1, 256, NULL, NULL, NULL, '2025-12-01 22:38:20', '2025-12-01 22:38:20'),
(254, 1, 1, 257, NULL, NULL, NULL, '2025-12-01 22:40:10', '2025-12-01 22:40:10'),
(255, 1, 1, 258, NULL, NULL, NULL, '2025-12-01 22:41:57', '2025-12-01 22:41:57'),
(256, 1, 1, 259, NULL, NULL, NULL, '2025-12-02 22:35:06', '2025-12-02 22:35:06'),
(257, 1, 1, 260, NULL, NULL, NULL, '2025-12-02 22:37:09', '2025-12-02 22:37:09'),
(258, 1, 1, 261, NULL, NULL, NULL, '2025-12-02 22:39:49', '2025-12-02 22:39:49'),
(259, 1, 1, 262, NULL, NULL, NULL, '2025-12-02 22:45:56', '2025-12-02 23:13:07'),
(260, 1, 1, 263, NULL, NULL, NULL, '2025-12-02 22:48:06', '2025-12-02 22:48:06'),
(261, 1, 1, 264, NULL, NULL, NULL, '2025-12-02 22:49:56', '2025-12-02 22:49:56'),
(262, 1, 1, 265, NULL, NULL, NULL, '2025-12-02 22:52:59', '2025-12-02 22:52:59'),
(263, 1, 1, 266, NULL, NULL, NULL, '2025-12-02 22:55:20', '2025-12-02 22:55:20'),
(264, 1, 1, 267, NULL, NULL, NULL, '2025-12-02 22:58:44', '2025-12-02 22:58:44'),
(265, 1, 1, 268, NULL, NULL, NULL, '2025-12-02 23:01:07', '2025-12-02 23:01:07'),
(266, 1, 1, 269, NULL, NULL, NULL, '2025-12-02 23:03:19', '2025-12-02 23:03:19'),
(267, 1, 1, 270, NULL, NULL, NULL, '2025-12-02 23:05:16', '2025-12-02 23:05:16'),
(268, 1, 1, 271, NULL, NULL, NULL, '2025-12-02 23:07:03', '2025-12-02 23:07:03'),
(269, 1, 1, 272, NULL, NULL, NULL, '2025-12-03 00:01:35', '2025-12-03 00:01:35'),
(270, 1, 1, 273, NULL, NULL, NULL, '2025-12-06 10:02:39', '2025-12-06 10:02:39'),
(271, 1, 1, 274, NULL, NULL, NULL, '2025-12-06 10:40:58', '2025-12-06 10:41:38'),
(272, 1, 1, 275, NULL, NULL, NULL, '2025-12-07 18:59:02', '2025-12-07 18:59:02'),
(273, 1, 1, 276, NULL, NULL, NULL, '2025-12-07 20:07:05', '2025-12-07 20:07:05'),
(274, 1, 1, 277, NULL, NULL, NULL, '2025-12-07 20:19:14', '2025-12-07 20:19:14'),
(275, 1, 1, 278, NULL, NULL, NULL, '2025-12-21 23:35:58', '2025-12-21 23:35:58'),
(276, 1, 1, 279, NULL, NULL, NULL, '2025-12-22 01:15:52', '2025-12-22 01:19:07'),
(277, 1, 1, 280, NULL, NULL, NULL, '2025-12-26 16:35:33', '2025-12-26 16:35:33'),
(278, 1, 1, 281, NULL, NULL, NULL, '2025-12-26 16:37:18', '2025-12-26 16:37:18'),
(279, 1, 1, 282, NULL, NULL, NULL, '2025-12-26 16:40:55', '2025-12-26 16:40:55');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `product_variations`
--

CREATE TABLE `product_variations` (
  `id` int(10) UNSIGNED NOT NULL,
  `variation_template_id` int(11) DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `is_dummy` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `product_variations`
--

INSERT INTO `product_variations` (`id`, `variation_template_id`, `name`, `product_id`, `is_dummy`, `created_at`, `updated_at`) VALUES
(4, 1, 'Talles', 4, 0, '2025-11-15 19:23:36', '2025-11-15 19:23:36'),
(5, 1, 'Talles', 5, 0, '2025-11-15 19:26:09', '2025-11-15 19:26:09'),
(6, 2, 'Color', 6, 0, '2025-11-15 19:28:40', '2025-11-15 19:28:40'),
(7, 2, 'Color', 6, 0, '2025-11-15 19:29:56', '2025-11-15 19:29:56'),
(8, NULL, 'DUMMY', 7, 1, '2025-11-15 19:31:19', '2025-11-15 19:31:19'),
(9, NULL, 'DUMMY', 8, 1, '2025-11-15 19:33:17', '2025-11-15 19:33:17'),
(10, 2, 'Color', 9, 0, '2025-11-15 19:36:40', '2025-11-15 19:36:40'),
(11, 1, 'Talles', 10, 0, '2025-11-15 19:38:22', '2025-11-15 19:38:22'),
(12, 1, 'Talles', 11, 0, '2025-11-15 19:40:35', '2025-11-15 19:40:35'),
(14, 1, 'Talles', 13, 0, '2025-11-15 20:02:19', '2025-11-15 20:02:19'),
(15, NULL, 'DUMMY', 14, 1, '2025-11-15 20:03:15', '2025-11-15 20:03:15'),
(16, NULL, 'DUMMY', 15, 1, '2025-11-15 20:18:22', '2025-11-15 20:18:22'),
(17, NULL, 'DUMMY', 16, 1, '2025-11-15 20:24:09', '2025-11-15 20:24:09'),
(19, 2, 'Color', 18, 0, '2025-11-15 20:31:08', '2025-11-15 20:31:08'),
(20, 2, 'Color', 19, 0, '2025-11-15 20:33:58', '2025-11-15 20:33:58'),
(21, NULL, 'DUMMY', 20, 1, '2025-11-15 20:37:39', '2025-11-15 20:37:39'),
(22, 2, 'Color', 21, 0, '2025-11-15 21:32:42', '2025-11-15 21:32:42'),
(23, 2, 'Color', 22, 0, '2025-11-15 21:54:27', '2025-11-15 21:54:27'),
(24, 1, 'Talles', 23, 0, '2025-11-15 21:56:07', '2025-11-15 21:56:07'),
(25, 1, 'Talles', 24, 0, '2025-11-15 22:01:02', '2025-11-15 22:01:02'),
(26, 1, 'Talles', 25, 0, '2025-11-15 22:02:22', '2025-11-15 22:02:22'),
(27, 1, 'Talles', 26, 0, '2025-11-15 22:03:32', '2025-11-15 22:03:32'),
(28, 1, 'Talles', 27, 0, '2025-11-15 22:04:39', '2025-11-15 22:04:39'),
(29, 1, 'Talles', 28, 0, '2025-11-15 22:05:54', '2025-11-15 22:05:54'),
(30, 1, 'Talles', 29, 0, '2025-11-15 22:06:54', '2025-11-15 22:06:54'),
(31, 2, 'Color', 30, 0, '2025-11-15 22:10:39', '2025-11-15 22:10:39'),
(32, 1, 'Talles', 31, 0, '2025-11-15 22:36:29', '2025-11-15 22:36:29'),
(33, 1, 'Talles', 32, 0, '2025-11-15 22:37:30', '2025-11-15 22:37:30'),
(34, 1, 'Talles', 33, 0, '2025-11-15 22:39:02', '2025-11-15 22:39:02'),
(35, 1, 'Talles', 34, 0, '2025-11-15 22:40:54', '2025-11-15 22:40:54'),
(36, 1, 'Talles', 35, 0, '2025-11-15 22:42:05', '2025-11-15 22:42:05'),
(37, 1, 'Talles', 36, 0, '2025-11-15 22:43:34', '2025-11-15 22:43:34'),
(38, 1, 'Talles', 37, 0, '2025-11-15 22:44:46', '2025-11-15 22:44:46'),
(39, 1, 'Talles', 38, 0, '2025-11-15 22:45:50', '2025-11-15 22:45:50'),
(40, 1, 'Talles', 39, 0, '2025-11-15 22:46:35', '2025-11-15 22:46:35'),
(41, 2, 'Color', 40, 0, '2025-11-24 12:45:06', '2025-11-24 12:45:06'),
(42, 2, 'Color', 41, 0, '2025-11-24 12:48:54', '2025-11-24 12:48:54'),
(43, 2, 'Color', 42, 0, '2025-11-24 12:51:30', '2025-11-24 12:51:30'),
(44, NULL, 'DUMMY', 43, 1, '2025-11-24 12:52:39', '2025-11-24 12:52:39'),
(45, NULL, 'DUMMY', 44, 1, '2025-11-24 12:59:57', '2025-11-24 12:59:57'),
(46, 2, 'Color', 45, 0, '2025-11-24 13:06:14', '2025-11-24 13:06:14'),
(47, NULL, 'DUMMY', 46, 1, '2025-11-24 13:07:48', '2025-11-24 13:07:48'),
(48, NULL, 'DUMMY', 47, 1, '2025-11-24 13:09:18', '2025-11-24 13:09:18'),
(49, NULL, 'DUMMY', 48, 1, '2025-11-24 13:11:05', '2025-11-24 13:11:05'),
(50, NULL, 'DUMMY', 49, 1, '2025-11-24 13:12:47', '2025-11-24 13:12:47'),
(51, 2, 'Color', 50, 0, '2025-11-24 13:15:24', '2025-11-24 13:15:24'),
(52, 2, 'Color', 51, 0, '2025-11-24 13:41:16', '2025-11-24 13:41:16'),
(53, 2, 'Color', 52, 0, '2025-11-24 13:54:29', '2025-11-24 13:54:29'),
(54, 2, 'Color', 53, 0, '2025-11-24 13:56:29', '2025-11-24 13:56:29'),
(55, NULL, 'DUMMY', 54, 1, '2025-11-24 13:59:50', '2025-11-24 13:59:50'),
(56, NULL, 'DUMMY', 55, 1, '2025-11-24 14:01:24', '2025-11-24 14:01:24'),
(57, 2, 'Color', 56, 0, '2025-11-24 14:04:43', '2025-11-24 14:04:43'),
(58, NULL, 'DUMMY', 57, 1, '2025-11-24 14:11:15', '2025-11-24 14:11:15'),
(59, NULL, 'DUMMY', 58, 1, '2025-11-24 14:11:53', '2025-11-24 14:11:53'),
(60, 2, 'Color', 59, 0, '2025-11-24 14:15:57', '2025-11-24 14:15:57'),
(61, 2, 'Color', 60, 0, '2025-11-24 14:17:39', '2025-11-24 14:17:39'),
(62, 2, 'Color', 61, 0, '2025-11-24 14:24:54', '2025-11-24 14:24:54'),
(63, 2, 'Color', 62, 0, '2025-11-24 15:04:16', '2025-11-24 15:04:16'),
(64, NULL, 'DUMMY', 63, 1, '2025-11-24 15:05:48', '2025-11-24 15:05:48'),
(65, NULL, 'DUMMY', 64, 1, '2025-11-24 15:06:55', '2025-11-24 15:06:55'),
(66, 2, 'Color', 65, 0, '2025-11-24 15:09:23', '2025-11-24 15:09:23'),
(67, 2, 'Color', 66, 0, '2025-11-24 15:12:41', '2025-11-24 15:12:41'),
(68, 1, 'Talles', 67, 0, '2025-11-24 15:46:42', '2025-11-24 15:46:42'),
(69, 1, 'Talles', 68, 0, '2025-11-24 15:49:22', '2025-11-24 15:49:22'),
(70, 1, 'Talles', 69, 0, '2025-11-24 15:52:14', '2025-11-24 15:52:14'),
(71, 1, 'Talles', 70, 0, '2025-11-24 15:56:06', '2025-11-24 15:56:06'),
(72, 1, 'Talles', 71, 0, '2025-11-24 15:59:23', '2025-11-24 15:59:23'),
(73, 2, 'Color', 72, 0, '2025-11-24 16:03:24', '2025-11-24 16:03:24'),
(74, 1, 'Talles', 73, 0, '2025-11-24 16:08:07', '2025-11-24 16:08:07'),
(75, 1, 'Talles', 74, 0, '2025-11-24 16:14:35', '2025-11-24 16:14:35'),
(76, 1, 'Talles', 75, 0, '2025-11-24 16:21:39', '2025-11-24 16:21:39'),
(77, 1, 'Talles', 76, 0, '2025-11-24 16:26:00', '2025-11-24 16:26:00'),
(78, 1, 'Talles', 77, 0, '2025-11-24 16:29:13', '2025-11-24 16:29:13'),
(79, 1, 'Talles', 78, 0, '2025-11-24 16:31:21', '2025-11-24 16:31:21'),
(80, 1, 'Talles', 79, 0, '2025-11-24 16:34:58', '2025-11-24 16:34:58'),
(81, 1, 'Talles', 80, 0, '2025-11-24 16:37:22', '2025-11-24 16:37:22'),
(82, 1, 'Talles', 81, 0, '2025-11-24 16:40:20', '2025-11-24 16:40:20'),
(83, 1, 'Talles', 82, 0, '2025-11-24 16:43:29', '2025-11-24 16:43:29'),
(84, 1, 'Talles', 83, 0, '2025-11-24 16:47:57', '2025-11-24 16:47:57'),
(85, 1, 'Talles', 84, 0, '2025-11-24 16:50:03', '2025-11-24 16:50:03'),
(86, 1, 'Talles', 85, 0, '2025-11-24 16:52:19', '2025-11-24 16:52:19'),
(87, 1, 'Talles', 86, 0, '2025-11-24 16:54:33', '2025-11-24 16:54:33'),
(88, 1, 'Talles', 87, 0, '2025-11-24 16:56:13', '2025-11-24 16:56:13'),
(89, 1, 'Talles', 88, 0, '2025-11-24 16:58:04', '2025-11-24 16:58:04'),
(90, 1, 'Talles', 89, 0, '2025-11-24 17:00:18', '2025-11-24 17:00:18'),
(91, 1, 'Talles', 90, 0, '2025-11-24 17:02:35', '2025-11-24 17:02:35'),
(92, 1, 'Talles', 91, 0, '2025-11-24 17:06:12', '2025-11-24 17:06:12'),
(93, 1, 'Talles', 92, 0, '2025-11-24 17:09:41', '2025-11-24 17:09:41'),
(94, 1, 'Talles', 93, 0, '2025-11-24 17:13:26', '2025-11-24 17:13:26'),
(95, 1, 'Talles', 94, 0, '2025-11-24 17:17:28', '2025-11-24 17:17:28'),
(96, 1, 'Talles', 95, 0, '2025-11-24 17:19:56', '2025-11-24 17:19:56'),
(97, 1, 'Talles', 96, 0, '2025-11-24 17:27:54', '2025-11-24 17:27:54'),
(98, 1, 'Talles', 97, 0, '2025-11-24 17:29:36', '2025-11-24 17:29:36'),
(99, 1, 'Talles', 98, 0, '2025-11-24 17:31:28', '2025-11-24 17:31:28'),
(100, 1, 'Talles', 99, 0, '2025-11-24 17:33:25', '2025-11-24 17:33:25'),
(101, 1, 'Talles', 100, 0, '2025-11-24 17:47:19', '2025-11-24 17:47:19'),
(102, 1, 'Talles', 101, 0, '2025-11-24 17:50:10', '2025-11-24 17:50:10'),
(103, 1, 'Talles', 102, 0, '2025-11-24 17:52:14', '2025-11-24 17:52:14'),
(104, 1, 'Talles', 103, 0, '2025-11-24 17:54:11', '2025-11-24 17:54:11'),
(105, 1, 'Talles', 104, 0, '2025-11-24 17:56:12', '2025-11-24 17:56:12'),
(106, 1, 'Talles', 105, 0, '2025-11-24 17:58:50', '2025-11-24 17:58:50'),
(107, 1, 'Talles', 106, 0, '2025-11-24 18:01:10', '2025-11-24 18:01:10'),
(108, 1, 'Talles', 107, 0, '2025-11-24 18:04:04', '2025-11-24 18:04:04'),
(110, 1, 'Talles', 108, 0, '2025-11-24 18:07:29', '2025-11-24 18:07:29'),
(111, 1, 'Talles', 109, 0, '2025-11-24 18:10:02', '2025-11-24 18:10:02'),
(112, 1, 'Talles', 110, 0, '2025-11-24 18:16:13', '2025-11-24 18:16:13'),
(113, 1, 'Talles', 111, 0, '2025-11-24 18:17:59', '2025-11-24 18:17:59'),
(114, 1, 'Talles', 112, 0, '2025-11-24 18:19:44', '2025-11-24 18:19:44'),
(115, 1, 'Talles', 113, 0, '2025-11-24 18:24:21', '2025-11-24 18:24:21'),
(116, 1, 'Talles', 114, 0, '2025-11-24 19:01:58', '2025-11-24 19:01:58'),
(117, 1, 'Talles', 115, 0, '2025-11-24 19:03:42', '2025-11-24 19:03:42'),
(118, 1, 'Talles', 116, 0, '2025-11-24 19:05:07', '2025-11-24 19:05:07'),
(119, 3, 'Talle pantalon', 117, 0, '2025-11-24 19:17:04', '2025-11-24 19:17:04'),
(120, 3, 'Talle pantalon', 118, 0, '2025-11-24 19:20:25', '2025-11-24 19:20:25'),
(121, 3, 'Talle pantalon', 119, 0, '2025-11-24 19:23:30', '2025-11-24 19:23:30'),
(122, 3, 'Talle pantalon', 120, 0, '2025-11-24 19:26:06', '2025-11-24 19:26:06'),
(123, 3, 'Talle pantalon', 121, 0, '2025-11-24 19:28:46', '2025-11-24 19:28:46'),
(124, 3, 'Talle pantalon', 122, 0, '2025-11-24 19:32:07', '2025-11-24 19:32:07'),
(125, 3, 'Talle pantalon', 123, 0, '2025-11-24 20:00:33', '2025-11-24 20:00:33'),
(126, 3, 'Talle pantalon', 124, 0, '2025-11-24 20:03:45', '2025-11-24 20:03:45'),
(127, 3, 'Talle pantalon', 125, 0, '2025-11-24 20:06:37', '2025-11-24 20:06:37'),
(128, 3, 'Talle pantalon', 126, 0, '2025-11-24 20:09:20', '2025-11-24 20:09:20'),
(129, 3, 'Talle pantalon', 127, 0, '2025-11-24 20:11:53', '2025-11-24 20:11:53'),
(130, 3, 'Talle pantalon', 128, 0, '2025-11-24 20:15:02', '2025-11-24 20:15:02'),
(131, 3, 'Talle pantalon', 129, 0, '2025-11-24 20:18:04', '2025-11-24 20:18:04'),
(132, 3, 'Talle pantalon', 130, 0, '2025-11-24 20:20:55', '2025-11-24 20:20:55'),
(133, 3, 'Talle pantalon', 131, 0, '2025-11-24 20:23:36', '2025-11-24 20:23:36'),
(134, 1, 'Talles', 132, 0, '2025-11-24 20:30:26', '2025-11-24 20:30:26'),
(135, 1, 'Talles', 133, 0, '2025-11-24 20:32:47', '2025-11-24 20:32:47'),
(136, 1, 'Talles', 134, 0, '2025-11-24 20:36:53', '2025-11-24 20:36:53'),
(137, 1, 'Talles', 135, 0, '2025-11-24 20:40:16', '2025-11-24 20:40:16'),
(138, 1, 'Talles', 136, 0, '2025-11-24 20:45:23', '2025-11-24 20:45:23'),
(140, 1, 'Talles', 138, 0, '2025-11-24 20:48:54', '2025-11-24 20:48:54'),
(141, 1, 'Talles', 139, 0, '2025-11-24 20:51:00', '2025-11-24 20:51:00'),
(142, 1, 'Talles', 140, 0, '2025-11-24 20:54:53', '2025-11-24 20:54:53'),
(143, 1, 'Talles', 141, 0, '2025-11-24 20:56:58', '2025-11-24 20:56:58'),
(144, 1, 'Talles', 142, 0, '2025-11-24 20:59:11', '2025-11-24 20:59:11'),
(145, 1, 'Talles', 143, 0, '2025-11-24 21:00:51', '2025-11-24 21:00:51'),
(146, 1, 'Talles', 144, 0, '2025-11-24 21:02:59', '2025-11-24 21:02:59'),
(147, 1, 'Talles', 145, 0, '2025-11-24 21:04:47', '2025-11-24 21:04:47'),
(148, 1, 'Talles', 146, 0, '2025-11-25 21:49:46', '2025-11-25 21:49:46'),
(149, 1, 'Talles', 147, 0, '2025-11-25 21:53:17', '2025-11-25 21:53:17'),
(150, 1, 'Talles', 148, 0, '2025-11-25 21:56:42', '2025-11-25 21:56:42'),
(151, 1, 'Talles', 149, 0, '2025-11-25 21:58:44', '2025-11-25 21:58:44'),
(152, 1, 'Talles', 150, 0, '2025-11-25 22:01:15', '2025-11-25 22:01:15'),
(153, 1, 'Talles', 151, 0, '2025-11-25 22:03:45', '2025-11-25 22:03:45'),
(154, 1, 'Talles', 152, 0, '2025-11-25 22:06:01', '2025-11-25 22:06:01'),
(155, 1, 'Talles', 153, 0, '2025-11-25 22:07:44', '2025-11-25 22:07:44'),
(156, 1, 'Talles', 154, 0, '2025-11-25 22:09:55', '2025-11-25 22:09:55'),
(157, 1, 'Talles', 155, 0, '2025-11-25 22:13:07', '2025-11-25 22:13:07'),
(158, 1, 'Talles', 156, 0, '2025-11-25 22:15:09', '2025-11-25 22:15:09'),
(159, 1, 'Talles', 157, 0, '2025-11-25 22:17:20', '2025-11-25 22:17:20'),
(160, 1, 'Talles', 158, 0, '2025-11-25 22:18:57', '2025-11-25 22:18:57'),
(161, 1, 'Talles', 159, 0, '2025-11-25 22:20:51', '2025-11-25 22:20:51'),
(162, 2, 'Color', 160, 0, '2025-11-25 22:23:18', '2025-11-25 22:23:18'),
(163, 1, 'Talles', 161, 0, '2025-11-25 22:25:39', '2025-11-25 22:25:39'),
(164, 1, 'Talles', 162, 0, '2025-11-25 22:28:42', '2025-11-25 22:28:42'),
(165, 1, 'Talles', 163, 0, '2025-11-25 22:34:11', '2025-11-25 22:34:11'),
(166, 1, 'Talles', 164, 0, '2025-11-25 22:36:08', '2025-11-25 22:36:08'),
(167, 1, 'Talles', 165, 0, '2025-11-25 22:40:31', '2025-11-25 22:40:31'),
(168, 1, 'Talles', 166, 0, '2025-11-25 22:46:44', '2025-11-25 22:46:44'),
(169, 1, 'Talles', 167, 0, '2025-11-25 22:48:55', '2025-11-25 22:48:55'),
(170, 1, 'Talles', 168, 0, '2025-11-25 23:02:13', '2025-11-25 23:02:13'),
(171, 1, 'Talles', 169, 0, '2025-11-26 20:09:54', '2025-11-26 20:09:54'),
(172, 1, 'Talles', 170, 0, '2025-11-26 20:14:00', '2025-11-26 20:14:00'),
(173, 1, 'Talles', 171, 0, '2025-11-26 20:18:16', '2025-11-26 20:18:16'),
(174, 1, 'Talles', 172, 0, '2025-11-26 20:20:15', '2025-11-26 20:20:15'),
(175, 1, 'Talles', 173, 0, '2025-11-26 20:22:22', '2025-11-26 20:22:22'),
(176, 1, 'Talles', 174, 0, '2025-11-26 20:30:15', '2025-11-26 20:30:15'),
(177, 1, 'Talles', 175, 0, '2025-11-26 20:39:12', '2025-11-26 20:39:12'),
(178, 1, 'Talles', 176, 0, '2025-11-26 20:41:20', '2025-11-26 20:41:20'),
(179, 1, 'Talles', 177, 0, '2025-11-26 20:45:05', '2025-11-26 20:45:05'),
(180, 1, 'Talles', 178, 0, '2025-11-26 20:47:15', '2025-11-26 20:47:15'),
(181, 1, 'Talles', 179, 0, '2025-11-26 20:49:40', '2025-11-26 20:49:40'),
(182, 1, 'Talles', 180, 0, '2025-11-26 20:51:53', '2025-11-26 20:51:53'),
(183, 1, 'Talles', 181, 0, '2025-11-26 20:55:13', '2025-11-26 20:55:13'),
(184, 1, 'Talles', 182, 0, '2025-11-26 21:10:57', '2025-11-26 21:10:57'),
(185, 1, 'Talles', 183, 0, '2025-11-26 21:17:58', '2025-11-26 21:17:58'),
(186, 2, 'Color', 184, 0, '2025-11-26 21:20:18', '2025-11-26 21:20:18'),
(187, 2, 'Color', 185, 0, '2025-11-26 21:22:25', '2025-11-26 21:22:25'),
(188, 2, 'Color', 186, 0, '2025-11-26 21:24:17', '2025-11-26 21:24:17'),
(190, 2, 'Color', 188, 0, '2025-11-26 21:29:35', '2025-11-26 21:29:35'),
(191, 1, 'Talles', 189, 0, '2025-11-26 21:31:56', '2025-11-26 21:31:56'),
(192, 2, 'Color', 190, 0, '2025-11-26 21:34:26', '2025-11-26 21:34:26'),
(193, 1, 'Talles', 183, 0, '2025-11-26 21:46:43', '2025-11-26 21:46:43'),
(194, NULL, 'DUMMY', 191, 1, '2025-11-26 21:55:20', '2025-11-26 21:55:20'),
(195, 2, 'Color', 192, 0, '2025-11-30 15:41:26', '2025-11-30 15:41:26'),
(196, 1, 'Talles', 193, 0, '2025-11-30 15:43:41', '2025-11-30 15:43:41'),
(197, 2, 'Color', 194, 0, '2025-11-30 15:52:23', '2025-11-30 15:52:23'),
(198, 1, 'Talles', 195, 0, '2025-11-30 15:55:10', '2025-11-30 15:55:10'),
(199, 1, 'Talles', 196, 0, '2025-11-30 15:57:52', '2025-11-30 15:57:52'),
(200, 1, 'Talles', 177, 0, '2025-11-30 15:58:50', '2025-11-30 15:58:50'),
(201, 1, 'Talles', 197, 0, '2025-11-30 16:01:21', '2025-11-30 16:01:21'),
(202, 2, 'Color', 198, 0, '2025-11-30 16:03:40', '2025-11-30 16:03:40'),
(203, 3, 'Talle pantalon', 199, 0, '2025-11-30 16:07:34', '2025-11-30 16:07:34'),
(204, 3, 'Talle pantalon', 200, 0, '2025-11-30 16:14:06', '2025-11-30 16:14:06'),
(205, 3, 'Talle pantalon', 201, 0, '2025-11-30 16:18:08', '2025-11-30 16:18:08'),
(206, 3, 'Talle pantalon', 202, 0, '2025-11-30 16:22:04', '2025-11-30 16:22:04'),
(208, 3, 'Talle pantalon', 204, 0, '2025-11-30 16:29:26', '2025-11-30 16:29:26'),
(209, 3, 'Talle pantalon', 205, 0, '2025-11-30 16:36:17', '2025-11-30 16:36:17'),
(210, 3, 'Talle pantalon', 205, 0, '2025-11-30 16:37:40', '2025-11-30 16:37:40'),
(211, 3, 'Talle pantalon', 206, 0, '2025-11-30 16:44:08', '2025-11-30 16:44:08'),
(212, 3, 'Talle pantalon', 207, 0, '2025-11-30 16:46:41', '2025-11-30 16:46:41'),
(213, 3, 'Talle pantalon', 208, 0, '2025-11-30 16:51:02', '2025-11-30 16:51:02'),
(214, 3, 'Talle pantalon', 209, 0, '2025-11-30 16:56:44', '2025-11-30 16:56:44'),
(215, 1, 'Talles', 210, 0, '2025-11-30 17:02:27', '2025-11-30 17:02:27'),
(216, 1, 'Talles', 211, 0, '2025-11-30 17:08:56', '2025-11-30 17:08:56'),
(217, 2, 'Color', 212, 0, '2025-11-30 17:13:24', '2025-11-30 17:13:24'),
(218, 1, 'Talles', 213, 0, '2025-11-30 17:16:43', '2025-11-30 17:16:43'),
(219, 2, 'Color', 214, 0, '2025-11-30 17:19:38', '2025-11-30 17:19:38'),
(220, 1, 'Talles', 215, 0, '2025-11-30 17:21:30', '2025-11-30 17:21:30'),
(221, 1, 'Talles', 216, 0, '2025-11-30 17:23:56', '2025-11-30 17:23:56'),
(222, 1, 'Talles', 217, 0, '2025-11-30 17:27:04', '2025-11-30 17:27:04'),
(223, 1, 'Talles', 218, 0, '2025-11-30 17:31:09', '2025-11-30 17:31:09'),
(224, 1, 'Talles', 219, 0, '2025-11-30 17:35:22', '2025-11-30 17:35:22'),
(225, 1, 'Talles', 220, 0, '2025-11-30 17:37:32', '2025-11-30 17:37:32'),
(226, 1, 'Talles', 221, 0, '2025-11-30 17:39:38', '2025-11-30 17:39:38'),
(227, 1, 'Talles', 222, 0, '2025-11-30 17:44:54', '2025-11-30 17:44:54'),
(228, 1, 'Talles', 223, 0, '2025-11-30 17:48:42', '2025-11-30 17:48:42'),
(229, 1, 'Talles', 224, 0, '2025-11-30 17:51:13', '2025-11-30 17:51:13'),
(230, 1, 'Talles', 225, 0, '2025-11-30 17:56:49', '2025-11-30 17:56:49'),
(231, 1, 'Talles', 226, 0, '2025-11-30 18:01:26', '2025-11-30 18:01:26'),
(232, 1, 'Talles', 227, 0, '2025-11-30 18:03:52', '2025-11-30 18:03:52'),
(233, 1, 'Talles', 228, 0, '2025-11-30 18:06:01', '2025-11-30 18:06:01'),
(234, 1, 'Talles', 229, 0, '2025-11-30 18:08:04', '2025-11-30 18:08:04'),
(236, 2, 'Color', 231, 0, '2025-11-30 18:32:04', '2025-11-30 18:32:04'),
(237, 2, 'Color', 232, 0, '2025-11-30 18:35:12', '2025-11-30 18:35:12'),
(238, 2, 'Color', 233, 0, '2025-11-30 18:36:50', '2025-11-30 18:36:50'),
(239, 2, 'Color', 234, 0, '2025-11-30 18:39:31', '2025-11-30 18:39:31'),
(240, 2, 'Color', 235, 0, '2025-11-30 18:44:23', '2025-11-30 18:44:23'),
(241, 2, 'Color', 236, 0, '2025-11-30 18:51:16', '2025-11-30 18:51:16'),
(242, 1, 'Talles', 237, 0, '2025-11-30 19:03:02', '2025-11-30 19:03:02'),
(243, 1, 'Talles', 238, 0, '2025-11-30 19:09:54', '2025-11-30 19:09:54'),
(244, 1, 'Talles', 239, 0, '2025-11-30 21:48:43', '2025-11-30 21:48:43'),
(245, 1, 'Talles', 240, 0, '2025-11-30 21:54:50', '2025-11-30 21:54:50'),
(246, 1, 'Talles', 241, 0, '2025-11-30 22:01:45', '2025-11-30 22:01:45'),
(247, 1, 'Talles', 242, 0, '2025-11-30 22:04:49', '2025-11-30 22:04:49'),
(248, 1, 'Talles', 243, 0, '2025-11-30 22:08:43', '2025-11-30 22:08:43'),
(249, 1, 'Talles', 244, 0, '2025-11-30 22:12:05', '2025-11-30 22:12:05'),
(250, 1, 'Talles', 245, 0, '2025-11-30 22:14:19', '2025-11-30 22:14:19'),
(251, 1, 'Talles', 246, 0, '2025-11-30 22:17:06', '2025-11-30 22:17:06'),
(252, 1, 'Talles', 247, 0, '2025-12-01 22:18:46', '2025-12-01 22:18:46'),
(253, 1, 'Talles', 248, 0, '2025-12-01 22:20:40', '2025-12-01 22:20:40'),
(254, 1, 'Talles', 249, 0, '2025-12-01 22:22:56', '2025-12-01 22:22:56'),
(255, 1, 'Talles', 250, 0, '2025-12-01 22:25:44', '2025-12-01 22:25:44'),
(256, 1, 'Talles', 251, 0, '2025-12-01 22:28:10', '2025-12-01 22:28:10'),
(257, 1, 'Talles', 252, 0, '2025-12-01 22:30:13', '2025-12-01 22:30:13'),
(258, 1, 'Talles', 253, 0, '2025-12-01 22:32:21', '2025-12-01 22:32:21'),
(259, 1, 'Talles', 254, 0, '2025-12-01 22:34:26', '2025-12-01 22:34:26'),
(260, 1, 'Talles', 255, 0, '2025-12-01 22:36:23', '2025-12-01 22:36:23'),
(261, 1, 'Talles', 256, 0, '2025-12-01 22:38:20', '2025-12-01 22:38:20'),
(262, 1, 'Talles', 257, 0, '2025-12-01 22:40:10', '2025-12-01 22:40:10'),
(263, 1, 'Talles', 258, 0, '2025-12-01 22:41:57', '2025-12-01 22:41:57'),
(264, 1, 'Talles', 259, 0, '2025-12-02 22:35:06', '2025-12-02 22:35:06'),
(265, 1, 'Talles', 260, 0, '2025-12-02 22:37:09', '2025-12-02 22:37:09'),
(266, 1, 'Talles', 261, 0, '2025-12-02 22:39:49', '2025-12-02 22:39:49'),
(267, 1, 'Talles', 262, 0, '2025-12-02 22:45:56', '2025-12-02 22:45:56'),
(268, 1, 'Talles', 263, 0, '2025-12-02 22:48:06', '2025-12-02 22:48:06'),
(269, 1, 'Talles', 264, 0, '2025-12-02 22:49:56', '2025-12-02 22:49:56'),
(270, 1, 'Talles', 265, 0, '2025-12-02 22:52:59', '2025-12-02 22:52:59'),
(271, 1, 'Talles', 266, 0, '2025-12-02 22:55:20', '2025-12-02 22:55:20'),
(272, 1, 'Talles', 267, 0, '2025-12-02 22:58:44', '2025-12-02 22:58:44'),
(273, 1, 'Talles', 268, 0, '2025-12-02 23:01:07', '2025-12-02 23:01:07'),
(274, 1, 'Talles', 269, 0, '2025-12-02 23:03:19', '2025-12-02 23:03:19'),
(275, 1, 'Talles', 270, 0, '2025-12-02 23:05:16', '2025-12-02 23:05:16'),
(276, 1, 'Talles', 271, 0, '2025-12-02 23:07:03', '2025-12-02 23:07:03'),
(277, 1, 'Talles', 272, 0, '2025-12-03 00:01:35', '2025-12-03 00:01:35'),
(278, 1, 'Talles', 96, 0, '2025-12-03 22:12:02', '2025-12-03 22:12:02'),
(279, NULL, 'DUMMY', 273, 1, '2025-12-06 10:02:39', '2025-12-06 10:02:39'),
(280, NULL, 'DUMMY', 274, 1, '2025-12-06 10:40:58', '2025-12-06 10:40:58'),
(281, 3, 'Talle pantalon', 275, 0, '2025-12-07 18:59:02', '2025-12-07 18:59:02'),
(282, 2, 'Color', 276, 0, '2025-12-07 20:07:05', '2025-12-07 20:07:05'),
(283, 1, 'Talles', 277, 0, '2025-12-07 20:19:14', '2025-12-07 20:19:14'),
(284, 3, 'Talle pantalon', 278, 0, '2025-12-21 23:35:58', '2025-12-21 23:35:58'),
(285, NULL, 'DUMMY', 279, 1, '2025-12-22 01:15:52', '2025-12-22 01:15:52'),
(286, 1, 'Talles', 241, 0, '2025-12-22 01:34:08', '2025-12-22 01:34:08'),
(287, 1, 'Talles', 250, 0, '2025-12-22 02:15:54', '2025-12-22 02:15:54'),
(288, 3, 'Talle pantalon', 280, 0, '2025-12-26 16:35:33', '2025-12-26 16:35:33'),
(289, 3, 'Talle pantalon', 281, 0, '2025-12-26 16:37:18', '2025-12-26 16:37:18'),
(290, 3, 'Talle pantalon', 282, 0, '2025-12-26 16:40:55', '2025-12-26 16:40:55');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `purchase_lines`
--

CREATE TABLE `purchase_lines` (
  `id` int(10) UNSIGNED NOT NULL,
  `transaction_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `variation_id` int(10) UNSIGNED NOT NULL,
  `quantity` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `secondary_unit_quantity` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `pp_without_discount` decimal(22,4) NOT NULL DEFAULT 0.0000 COMMENT 'Purchase price before inline discounts',
  `discount_percent` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Inline discount percentage',
  `purchase_price` decimal(22,4) NOT NULL,
  `purchase_price_inc_tax` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `item_tax` decimal(22,4) NOT NULL COMMENT 'Tax for one quantity',
  `tax_id` int(10) UNSIGNED DEFAULT NULL,
  `purchase_requisition_line_id` int(11) DEFAULT NULL,
  `purchase_order_line_id` int(11) DEFAULT NULL,
  `quantity_sold` decimal(22,4) NOT NULL DEFAULT 0.0000 COMMENT 'Quanity sold from this purchase line',
  `quantity_adjusted` decimal(22,4) NOT NULL DEFAULT 0.0000 COMMENT 'Quanity adjusted in stock adjustment from this purchase line',
  `quantity_returned` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `po_quantity_purchased` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `mfg_quantity_used` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `mfg_date` date DEFAULT NULL,
  `exp_date` date DEFAULT NULL,
  `lot_number` varchar(191) DEFAULT NULL,
  `sub_unit_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `purchase_lines`
--

INSERT INTO `purchase_lines` (`id`, `transaction_id`, `product_id`, `variation_id`, `quantity`, `secondary_unit_quantity`, `pp_without_discount`, `discount_percent`, `purchase_price`, `purchase_price_inc_tax`, `item_tax`, `tax_id`, `purchase_requisition_line_id`, `purchase_order_line_id`, `quantity_sold`, `quantity_adjusted`, `quantity_returned`, `po_quantity_purchased`, `mfg_quantity_used`, `mfg_date`, `exp_date`, `lot_number`, `sub_unit_id`, `created_at`, `updated_at`) VALUES
(8, 12, 259, 412, 2.0000, 0.0000, 8000.0000, 0.00, 8000.0000, 8000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(9, 12, 259, 413, 2.0000, 0.0000, 8000.0000, 0.00, 8000.0000, 8000.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-31 20:28:29'),
(10, 12, 260, 414, 1.0000, 0.0000, 6900.0000, 0.00, 6900.0000, 6900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(11, 12, 260, 415, 2.0000, 0.0000, 6900.0000, 0.00, 6900.0000, 6900.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-31 20:28:29'),
(12, 12, 260, 416, 1.0000, 0.0000, 6900.0000, 0.00, 6900.0000, 6900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(13, 12, 261, 417, 1.0000, 0.0000, 7500.0000, 0.00, 7500.0000, 7500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(14, 12, 261, 418, 2.0000, 0.0000, 7500.0000, 0.00, 7500.0000, 7500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(15, 12, 261, 419, 1.0000, 0.0000, 7500.0000, 0.00, 7500.0000, 7500.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-31 20:28:29'),
(16, 12, 262, 420, 3.0000, 0.0000, 6500.0000, 0.00, 6500.0000, 6500.0000, 0.0000, NULL, NULL, NULL, 2.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-21 23:45:11'),
(17, 12, 262, 421, 5.0000, 0.0000, 6500.0000, 0.00, 6500.0000, 6500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(18, 12, 262, 422, 2.0000, 0.0000, 6500.0000, 0.00, 6500.0000, 6500.0000, 0.0000, NULL, NULL, NULL, 2.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-21 23:13:37'),
(19, 12, 263, 423, 2.0000, 0.0000, 8500.0000, 0.00, 8500.0000, 8500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(20, 12, 263, 424, 2.0000, 0.0000, 8500.0000, 0.00, 8500.0000, 8500.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-21 23:17:48'),
(21, 12, 263, 425, 2.0000, 0.0000, 8500.0000, 0.00, 8500.0000, 8500.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-30 01:32:36'),
(22, 12, 264, 426, 1.0000, 0.0000, 11900.0000, 0.00, 11900.0000, 11900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(23, 12, 264, 427, 1.0000, 0.0000, 11900.0000, 0.00, 11900.0000, 11900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(24, 12, 265, 428, 2.0000, 0.0000, 5300.0000, 0.00, 5300.0000, 5300.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(25, 12, 266, 429, 4.0000, 0.0000, 6500.0000, 0.00, 6500.0000, 6500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(26, 12, 266, 430, 4.0000, 0.0000, 6500.0000, 0.00, 6500.0000, 6500.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-30 01:38:54'),
(27, 12, 266, 431, 2.0000, 0.0000, 6500.0000, 0.00, 6500.0000, 6500.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-21 22:59:46'),
(28, 12, 267, 432, 2.0000, 0.0000, 12500.0000, 0.00, 12500.0000, 12500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(29, 12, 267, 433, 2.0000, 0.0000, 12500.0000, 0.00, 12500.0000, 12500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(30, 12, 268, 434, 2.0000, 0.0000, 5000.0000, 0.00, 5000.0000, 5000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(31, 12, 268, 435, 2.0000, 0.0000, 5000.0000, 0.00, 5000.0000, 5000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(32, 12, 268, 436, 2.0000, 0.0000, 5000.0000, 0.00, 5000.0000, 5000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(33, 12, 269, 437, 3.0000, 0.0000, 5500.0000, 0.00, 5500.0000, 5500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(34, 12, 269, 438, 2.0000, 0.0000, 5500.0000, 0.00, 5500.0000, 5500.0000, 0.0000, NULL, NULL, NULL, 2.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-21 23:13:37'),
(35, 12, 270, 439, 1.0000, 0.0000, 5500.0000, 0.00, 5500.0000, 5500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(36, 12, 270, 440, 1.0000, 0.0000, 5500.0000, 0.00, 5500.0000, 5500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(37, 12, 270, 441, 1.0000, 0.0000, 5500.0000, 0.00, 5500.0000, 5500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(38, 12, 271, 442, 1.0000, 0.0000, 5000.0000, 0.00, 5000.0000, 5000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:21:19'),
(39, 13, 40, 80, 1.0000, 0.0000, 3600.0000, 0.00, 3600.0000, 3600.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(40, 13, 40, 81, 1.0000, 0.0000, 3600.0000, 0.00, 3600.0000, 3600.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(41, 13, 40, 82, 1.0000, 0.0000, 3600.0000, 0.00, 3600.0000, 3600.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(42, 13, 41, 83, 1.0000, 0.0000, 7900.0000, 0.00, 7900.0000, 7900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(43, 13, 42, 84, 1.0000, 0.0000, 6600.0000, 0.00, 6600.0000, 6600.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(44, 13, 42, 85, 1.0000, 0.0000, 6600.0000, 0.00, 6600.0000, 6600.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(45, 13, 43, 86, 1.0000, 0.0000, 9000.0000, 0.00, 9000.0000, 9000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(46, 13, 44, 87, 1.0000, 0.0000, 17500.0000, 0.00, 17500.0000, 17500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(47, 13, 45, 88, 1.0000, 0.0000, 5300.0000, 0.00, 5300.0000, 5300.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(48, 13, 45, 89, 1.0000, 0.0000, 5300.0000, 0.00, 5300.0000, 5300.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(49, 13, 47, 91, 1.0000, 0.0000, 8500.0000, 0.00, 8500.0000, 8500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(50, 13, 48, 92, 1.0000, 0.0000, 5400.0000, 0.00, 5400.0000, 5400.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(51, 13, 49, 93, 1.0000, 0.0000, 6000.0000, 0.00, 6000.0000, 6000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(52, 13, 50, 94, 1.0000, 0.0000, 3600.0000, 0.00, 3600.0000, 3600.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(53, 13, 50, 95, 1.0000, 0.0000, 3600.0000, 0.00, 3600.0000, 3600.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(54, 13, 51, 96, 1.0000, 0.0000, 8000.0000, 0.00, 8000.0000, 8000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(55, 13, 51, 97, 1.0000, 0.0000, 8000.0000, 0.00, 8000.0000, 8000.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:32:08', '2025-12-30 01:24:03'),
(56, 13, 46, 90, 1.0000, 0.0000, 5800.0000, 0.00, 5800.0000, 5800.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(57, 14, 52, 98, 1.0000, 0.0000, 9000.0000, 0.00, 9000.0000, 9000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-02 23:36:39'),
(58, 14, 53, 99, 1.0000, 0.0000, 16500.0000, 0.00, 16500.0000, 16500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-02 23:36:39'),
(59, 14, 54, 100, 1.0000, 0.0000, 16500.0000, 0.00, 16500.0000, 16500.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-21 22:54:08'),
(60, 14, 55, 101, 1.0000, 0.0000, 16500.0000, 0.00, 16500.0000, 16500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-02 23:36:39'),
(61, 14, 56, 102, 1.0000, 0.0000, 9000.0000, 0.00, 9000.0000, 9000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-02 23:36:39'),
(62, 14, 56, 103, 1.0000, 0.0000, 9000.0000, 0.00, 9000.0000, 9000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-02 23:36:39'),
(63, 14, 56, 104, 1.0000, 0.0000, 9000.0000, 0.00, 9000.0000, 9000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-02 23:36:39'),
(64, 14, 57, 105, 1.0000, 0.0000, 10000.0000, 0.00, 10000.0000, 10000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-02 23:36:39'),
(65, 14, 58, 106, 1.0000, 0.0000, 9000.0000, 0.00, 9000.0000, 9000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-02 23:36:39'),
(66, 14, 59, 107, 1.0000, 0.0000, 6000.0000, 0.00, 6000.0000, 6000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-02 23:36:39'),
(67, 14, 60, 108, 1.0000, 0.0000, 10000.0000, 0.00, 10000.0000, 10000.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-30 01:21:19'),
(68, 14, 61, 109, 1.0000, 0.0000, 7500.0000, 0.00, 7500.0000, 7500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-02 23:36:39'),
(69, 14, 61, 110, 1.0000, 0.0000, 7500.0000, 0.00, 7500.0000, 7500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-02 23:36:39'),
(70, 14, 62, 111, 1.0000, 0.0000, 12000.0000, 0.00, 12000.0000, 12000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-02 23:36:39'),
(71, 14, 63, 112, 1.0000, 0.0000, 12500.0000, 0.00, 12500.0000, 12500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-02 23:36:39'),
(72, 14, 64, 113, 1.0000, 0.0000, 13000.0000, 0.00, 13000.0000, 13000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-02 23:36:39'),
(73, 14, 65, 114, 1.0000, 0.0000, 7500.0000, 0.00, 7500.0000, 7500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-02 23:36:39'),
(74, 14, 65, 115, 1.0000, 0.0000, 7500.0000, 0.00, 7500.0000, 7500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-02 23:36:39'),
(75, 14, 66, 116, 1.0000, 0.0000, 4000.0000, 0.00, 4000.0000, 4000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-02 23:36:39'),
(76, 15, 67, 117, 1.0000, 0.0000, 13600.0000, 0.00, 13600.0000, 13600.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:45:18', '2025-12-02 23:45:18'),
(77, 15, 68, 118, 1.0000, 0.0000, 15645.0000, 0.00, 15645.0000, 15645.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:45:18', '2025-12-02 23:45:18'),
(78, 15, 69, 119, 1.0000, 0.0000, 12180.0000, 0.00, 12180.0000, 12180.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:45:18', '2025-12-02 23:45:18'),
(79, 15, 69, 120, 1.0000, 0.0000, 12180.0000, 0.00, 12180.0000, 12180.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:45:18', '2025-12-30 01:38:54'),
(80, 15, 69, 121, 1.0000, 0.0000, 12180.0000, 0.00, 12180.0000, 12180.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:45:18', '2025-12-30 01:32:36'),
(81, 15, 75, 132, 1.0000, 0.0000, 14500.0000, 0.00, 14500.0000, 14500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:45:18', '2025-12-02 23:45:18'),
(82, 15, 75, 133, 1.0000, 0.0000, 14500.0000, 0.00, 14500.0000, 14500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:45:18', '2025-12-02 23:45:18'),
(83, 15, 71, 124, 3.0000, 0.0000, 9000.0000, 0.00, 9000.0000, 9000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:45:18', '2025-12-02 23:45:18'),
(84, 15, 72, 125, 1.0000, 0.0000, 13000.0000, 0.00, 13000.0000, 13000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:45:18', '2025-12-02 23:45:18'),
(85, 15, 72, 126, 1.0000, 0.0000, 13000.0000, 0.00, 13000.0000, 13000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:45:18', '2025-12-02 23:45:18'),
(86, 15, 72, 127, 1.0000, 0.0000, 13000.0000, 0.00, 13000.0000, 13000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:45:18', '2025-12-02 23:45:18'),
(87, 15, 73, 128, 2.0000, 0.0000, 17000.0000, 0.00, 17000.0000, 17000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:45:18', '2025-12-02 23:45:18'),
(88, 15, 73, 129, 2.0000, 0.0000, 17000.0000, 0.00, 17000.0000, 17000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:45:18', '2025-12-02 23:45:18'),
(89, 15, 74, 130, 1.0000, 0.0000, 20790.0000, 0.00, 20790.0000, 20790.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:45:18', '2025-12-02 23:45:18'),
(90, 15, 74, 131, 1.0000, 0.0000, 20790.0000, 0.00, 20790.0000, 20790.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:45:18', '2025-12-02 23:45:18'),
(91, 15, 70, 122, 2.0000, 0.0000, 5000.0000, 0.00, 5000.0000, 5000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:45:18', '2025-12-02 23:45:18'),
(92, 15, 70, 123, 1.0000, 0.0000, 5000.0000, 0.00, 5000.0000, 5000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-02 23:45:18', '2025-12-02 23:45:18'),
(93, 16, 76, 134, 1.0000, 0.0000, 9000.0000, 0.00, 9000.0000, 9000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(94, 16, 77, 135, 1.0000, 0.0000, 12500.0000, 0.00, 12500.0000, 12500.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-31 20:28:29'),
(95, 16, 78, 136, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(96, 16, 79, 137, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(97, 16, 80, 138, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(98, 16, 81, 139, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(99, 16, 82, 140, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(100, 16, 83, 141, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(101, 16, 84, 142, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(102, 16, 85, 143, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(103, 16, 86, 144, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(104, 16, 87, 145, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(105, 16, 88, 146, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(106, 16, 89, 147, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(107, 16, 90, 148, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(108, 16, 91, 149, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(109, 16, 92, 150, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(110, 16, 93, 151, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(111, 16, 94, 152, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(112, 16, 95, 153, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(113, 16, 95, 154, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(114, 16, 96, 155, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(115, 16, 97, 156, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(116, 16, 98, 157, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(117, 16, 98, 158, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(118, 16, 98, 159, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(119, 16, 99, 160, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(120, 16, 100, 161, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(121, 16, 100, 162, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(122, 16, 101, 163, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(123, 16, 102, 164, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(124, 16, 103, 165, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(125, 16, 104, 166, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(126, 16, 104, 167, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(127, 16, 105, 168, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(128, 16, 106, 169, 2.0000, 0.0000, 8600.0000, 0.00, 8600.0000, 8600.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(129, 16, 106, 170, 2.0000, 0.0000, 8600.0000, 0.00, 8600.0000, 8600.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(130, 16, 107, 171, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(131, 16, 107, 172, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(132, 16, 108, 174, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(133, 16, 109, 175, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(134, 16, 109, 176, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(135, 16, 109, 177, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(136, 16, 110, 178, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(137, 16, 111, 179, 1.0000, 0.0000, 10150.0000, 0.00, 10150.0000, 10150.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(138, 16, 112, 180, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(139, 16, 113, 181, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(140, 16, 114, 182, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(141, 16, 114, 183, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(142, 16, 115, 184, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(143, 16, 116, 185, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(144, 16, 272, 443, 1.0000, 0.0000, 7450.0000, 0.00, 7450.0000, 7450.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-03 00:03:27'),
(145, 17, 117, 186, 1.0000, 0.0000, 28000.0000, 0.00, 28000.0000, 28000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(146, 17, 118, 187, 1.0000, 0.0000, 26500.0000, 0.00, 26500.0000, 26500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(147, 17, 118, 188, 1.0000, 0.0000, 26500.0000, 0.00, 26500.0000, 26500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(148, 17, 118, 189, 1.0000, 0.0000, 26500.0000, 0.00, 26500.0000, 26500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(149, 17, 119, 190, 1.0000, 0.0000, 25500.0000, 0.00, 25500.0000, 25500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(150, 17, 120, 191, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(151, 17, 121, 192, 1.0000, 0.0000, 26500.0000, 0.00, 26500.0000, 26500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(152, 17, 122, 193, 1.0000, 0.0000, 26500.0000, 0.00, 26500.0000, 26500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(153, 17, 122, 194, 1.0000, 0.0000, 26500.0000, 0.00, 26500.0000, 26500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(154, 17, 122, 195, 1.0000, 0.0000, 26500.0000, 0.00, 26500.0000, 26500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(155, 17, 123, 196, 1.0000, 0.0000, 26500.0000, 0.00, 26500.0000, 26500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(156, 17, 123, 197, 1.0000, 0.0000, 26500.0000, 0.00, 26500.0000, 26500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(157, 17, 124, 198, 1.0000, 0.0000, 25000.0000, 0.00, 25000.0000, 25000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(158, 17, 124, 199, 1.0000, 0.0000, 25000.0000, 0.00, 25000.0000, 25000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(159, 17, 124, 200, 1.0000, 0.0000, 25000.0000, 0.00, 25000.0000, 25000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(160, 17, 125, 201, 1.0000, 0.0000, 26500.0000, 0.00, 26500.0000, 26500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(161, 17, 126, 202, 1.0000, 0.0000, 9900.0000, 0.00, 9900.0000, 9900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(162, 17, 127, 203, 1.0000, 0.0000, 9900.0000, 0.00, 9900.0000, 9900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(163, 17, 128, 204, 1.0000, 0.0000, 19000.0000, 0.00, 19000.0000, 19000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(164, 17, 128, 205, 1.0000, 0.0000, 19000.0000, 0.00, 19000.0000, 19000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(165, 17, 128, 206, 1.0000, 0.0000, 19000.0000, 0.00, 19000.0000, 19000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(166, 17, 129, 207, 1.0000, 0.0000, 20000.0000, 0.00, 20000.0000, 20000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(167, 17, 129, 208, 1.0000, 0.0000, 20000.0000, 0.00, 20000.0000, 20000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(168, 17, 130, 209, 1.0000, 0.0000, 19000.0000, 0.00, 19000.0000, 19000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(169, 17, 131, 210, 1.0000, 0.0000, 9900.0000, 0.00, 9900.0000, 9900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(170, 17, 131, 211, 1.0000, 0.0000, 9900.0000, 0.00, 9900.0000, 9900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-06 09:41:42'),
(171, 18, 132, 212, 1.0000, 0.0000, 35000.0000, 0.00, 35000.0000, 35000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(172, 18, 133, 213, 1.0000, 0.0000, 44859.2000, 0.00, 44859.2000, 44859.2000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(173, 18, 134, 214, 1.0000, 0.0000, 45000.0000, 0.00, 45000.0000, 45000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(174, 18, 135, 215, 1.0000, 0.0000, 30000.0000, 0.00, 30000.0000, 30000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(175, 18, 136, 216, 2.0000, 0.0000, 8000.0000, 0.00, 8000.0000, 8000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(176, 18, 273, 445, 1.0000, 0.0000, 12000.0000, 0.00, 12000.0000, 12000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(177, 18, 138, 218, 1.0000, 0.0000, 8000.0000, 0.00, 8000.0000, 8000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(178, 18, 139, 219, 2.0000, 0.0000, 8480.0000, 0.00, 8480.0000, 8480.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-30 01:32:36'),
(179, 18, 140, 220, 2.0000, 0.0000, 5000.0000, 0.00, 5000.0000, 5000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(180, 18, 140, 221, 1.0000, 0.0000, 5000.0000, 0.00, 5000.0000, 5000.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-30 01:53:24'),
(181, 18, 141, 222, 1.0000, 0.0000, 5000.0000, 0.00, 5000.0000, 5000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(182, 18, 142, 223, 1.0000, 0.0000, 8480.0000, 0.00, 8480.0000, 8480.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(183, 18, 143, 224, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(184, 18, 144, 225, 1.0000, 0.0000, 10000.0000, 0.00, 10000.0000, 10000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(185, 18, 144, 226, 1.0000, 0.0000, 10000.0000, 0.00, 10000.0000, 10000.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2026-01-02 17:03:20'),
(186, 18, 145, 227, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(187, 18, 146, 228, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(188, 18, 147, 229, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(189, 18, 148, 230, 1.0000, 0.0000, 12000.0000, 0.00, 12000.0000, 12000.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2026-01-02 17:03:20'),
(190, 18, 149, 231, 1.0000, 0.0000, 12000.0000, 0.00, 12000.0000, 12000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(191, 18, 150, 232, 1.0000, 0.0000, 15040.0000, 0.00, 15040.0000, 15040.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(192, 18, 151, 233, 1.0000, 0.0000, 12000.0000, 0.00, 12000.0000, 12000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(193, 18, 152, 234, 1.0000, 0.0000, 15920.0000, 0.00, 15920.0000, 15920.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(194, 18, 153, 235, 1.0000, 0.0000, 10000.0000, 0.00, 10000.0000, 10000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(195, 18, 154, 236, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(196, 18, 155, 237, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(197, 18, 156, 238, 1.0000, 0.0000, 14960.0000, 0.00, 14960.0000, 14960.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(198, 18, 157, 239, 1.0000, 0.0000, 8000.0000, 0.00, 8000.0000, 8000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(199, 18, 158, 240, 1.0000, 0.0000, 8000.0000, 0.00, 8000.0000, 8000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(200, 18, 159, 241, 1.0000, 0.0000, 12000.0000, 0.00, 12000.0000, 12000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(201, 18, 160, 242, 1.0000, 0.0000, 12000.0000, 0.00, 12000.0000, 12000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(202, 18, 161, 243, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-30 01:32:36'),
(203, 18, 162, 244, 1.0000, 0.0000, 30000.0000, 0.00, 30000.0000, 30000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(204, 18, 162, 245, 1.0000, 0.0000, 30000.0000, 0.00, 30000.0000, 30000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:31'),
(205, 19, 163, 246, 1.0000, 0.0000, 22000.0000, 0.00, 22000.0000, 22000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:21:33', '2025-12-06 10:21:33'),
(206, 19, 164, 247, 1.0000, 0.0000, 22490.0000, 0.00, 22490.0000, 22490.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:21:33', '2025-12-06 10:21:33'),
(207, 19, 165, 248, 2.0000, 0.0000, 19990.0000, 0.00, 19990.0000, 19990.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:21:33', '2025-12-06 10:21:33'),
(208, 19, 165, 249, 2.0000, 0.0000, 19990.0000, 0.00, 19990.0000, 19990.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:21:33', '2025-12-06 10:21:33'),
(209, 19, 166, 250, 1.0000, 0.0000, 18750.0000, 0.00, 18750.0000, 18750.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:21:33', '2025-12-06 10:21:33'),
(210, 19, 166, 251, 1.0000, 0.0000, 18750.0000, 0.00, 18750.0000, 18750.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:21:33', '2025-12-30 01:32:36'),
(211, 19, 167, 252, 1.0000, 0.0000, 22500.0000, 0.00, 22500.0000, 22500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:21:33', '2025-12-06 10:21:33'),
(212, 19, 168, 253, 1.0000, 0.0000, 31250.0000, 0.00, 31250.0000, 31250.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:21:33', '2025-12-06 10:21:33'),
(213, 19, 169, 254, 1.0000, 0.0000, 18750.0000, 0.00, 18750.0000, 18750.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:21:33', '2025-12-06 10:21:33'),
(214, 19, 169, 255, 1.0000, 0.0000, 18750.0000, 0.00, 18750.0000, 18750.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:21:33', '2025-12-21 23:37:22'),
(215, 19, 169, 256, 1.0000, 0.0000, 18750.0000, 0.00, 18750.0000, 18750.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:21:33', '2025-12-06 10:21:33'),
(216, 19, 170, 257, 2.0000, 0.0000, 22500.0000, 0.00, 22500.0000, 22500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:21:33', '2025-12-06 10:21:33'),
(217, 19, 170, 258, 1.0000, 0.0000, 22500.0000, 0.00, 22500.0000, 22500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:21:33', '2025-12-06 10:21:33'),
(218, 19, 171, 259, 1.0000, 0.0000, 37490.0000, 0.00, 37490.0000, 37490.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:21:33', '2025-12-21 23:13:37'),
(219, 19, 172, 260, 2.0000, 0.0000, 18785.0000, 0.00, 18785.0000, 18785.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:21:33', '2025-12-06 10:21:33'),
(220, 19, 173, 261, 1.0000, 0.0000, 27551.0000, 0.00, 27551.0000, 27551.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:21:33', '2025-12-06 10:21:33'),
(221, 19, 174, 262, 1.0000, 0.0000, 27551.0000, 0.00, 27551.0000, 27551.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:21:33', '2025-12-06 10:21:33'),
(222, 20, 175, 263, 1.0000, 0.0000, 19900.0000, 0.00, 19900.0000, 19900.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-21 22:59:46'),
(223, 20, 176, 264, 1.0000, 0.0000, 32900.0000, 0.00, 32900.0000, 32900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(224, 20, 177, 265, 1.0000, 0.0000, 29900.0000, 0.00, 29900.0000, 29900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(225, 20, 177, 287, 1.0000, 0.0000, 29900.0000, 0.00, 29900.0000, 29900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(226, 20, 178, 266, 1.0000, 0.0000, 26900.0000, 0.00, 26900.0000, 26900.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-08 19:54:14'),
(227, 20, 179, 267, 1.0000, 0.0000, 5000.0000, 0.00, 5000.0000, 5000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(228, 20, 179, 268, 1.0000, 0.0000, 5000.0000, 0.00, 5000.0000, 5000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(229, 20, 180, 269, 1.0000, 0.0000, 17900.0000, 0.00, 17900.0000, 17900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(230, 20, 181, 270, 1.0000, 0.0000, 18900.0000, 0.00, 18900.0000, 18900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(231, 20, 182, 271, 1.0000, 0.0000, 22900.0000, 0.00, 22900.0000, 22900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(232, 20, 183, 272, 1.0000, 0.0000, 24900.0000, 0.00, 24900.0000, 24900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(233, 20, 183, 280, 1.0000, 0.0000, 24900.0000, 0.00, 24900.0000, 24900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(234, 20, 184, 273, 1.0000, 0.0000, 9900.0000, 0.00, 9900.0000, 9900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(235, 20, 185, 274, 1.0000, 0.0000, 17900.0000, 0.00, 17900.0000, 17900.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2026-01-03 16:22:05'),
(236, 20, 186, 275, 1.0000, 0.0000, 14900.0000, 0.00, 14900.0000, 14900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(237, 20, 274, 446, 1.0000, 0.0000, 17000.0000, 0.00, 17000.0000, 17000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(238, 20, 188, 277, 1.0000, 0.0000, 15900.0000, 0.00, 15900.0000, 15900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(239, 20, 189, 278, 1.0000, 0.0000, 26900.0000, 0.00, 26900.0000, 26900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(240, 20, 190, 279, 1.0000, 0.0000, 11900.0000, 0.00, 11900.0000, 11900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(241, 20, 191, 281, 1.0000, 0.0000, 24900.0000, 0.00, 24900.0000, 24900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38');
INSERT INTO `purchase_lines` (`id`, `transaction_id`, `product_id`, `variation_id`, `quantity`, `secondary_unit_quantity`, `pp_without_discount`, `discount_percent`, `purchase_price`, `purchase_price_inc_tax`, `item_tax`, `tax_id`, `purchase_requisition_line_id`, `purchase_order_line_id`, `quantity_sold`, `quantity_adjusted`, `quantity_returned`, `po_quantity_purchased`, `mfg_quantity_used`, `mfg_date`, `exp_date`, `lot_number`, `sub_unit_id`, `created_at`, `updated_at`) VALUES
(242, 20, 192, 282, 1.0000, 0.0000, 12900.0000, 0.00, 12900.0000, 12900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(243, 20, 193, 283, 1.0000, 0.0000, 19900.0000, 0.00, 19900.0000, 19900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(244, 20, 194, 284, 1.0000, 0.0000, 17900.0000, 0.00, 17900.0000, 17900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(245, 20, 195, 285, 1.0000, 0.0000, 15900.0000, 0.00, 15900.0000, 15900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(246, 20, 196, 286, 1.0000, 0.0000, 22900.0000, 0.00, 22900.0000, 22900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(247, 20, 197, 288, 1.0000, 0.0000, 17900.0000, 0.00, 17900.0000, 17900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(248, 20, 198, 289, 1.0000, 0.0000, 16900.0000, 0.00, 16900.0000, 16900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-06 10:53:38'),
(249, 21, 199, 290, 1.0000, 0.0000, 17000.0000, 0.00, 17000.0000, 17000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(250, 21, 200, 291, 1.0000, 0.0000, 10000.0000, 0.00, 10000.0000, 10000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(251, 21, 200, 292, 1.0000, 0.0000, 10000.0000, 0.00, 10000.0000, 10000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(252, 21, 201, 293, 1.0000, 0.0000, 16000.0000, 0.00, 16000.0000, 16000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(253, 21, 201, 294, 1.0000, 0.0000, 16000.0000, 0.00, 16000.0000, 16000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(254, 21, 201, 295, 1.0000, 0.0000, 16000.0000, 0.00, 16000.0000, 16000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(255, 21, 201, 296, 1.0000, 0.0000, 16000.0000, 0.00, 16000.0000, 16000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(256, 21, 202, 297, 1.0000, 0.0000, 16000.0000, 0.00, 16000.0000, 16000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(257, 21, 202, 298, 1.0000, 0.0000, 16000.0000, 0.00, 16000.0000, 16000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(258, 21, 275, 447, 1.0000, 0.0000, 17000.0000, 0.00, 17000.0000, 17000.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-30 01:38:54'),
(259, 21, 275, 448, 1.0000, 0.0000, 17000.0000, 0.00, 17000.0000, 17000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(260, 21, 275, 449, 1.0000, 0.0000, 17000.0000, 0.00, 17000.0000, 17000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(261, 21, 204, 302, 1.0000, 0.0000, 17000.0000, 0.00, 17000.0000, 17000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(262, 21, 204, 303, 1.0000, 0.0000, 17000.0000, 0.00, 17000.0000, 17000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(263, 21, 205, 304, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(264, 21, 205, 305, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(265, 21, 205, 306, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(266, 21, 205, 307, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(267, 21, 206, 308, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(268, 21, 206, 309, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(269, 21, 206, 310, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(270, 21, 207, 311, 1.0000, 0.0000, 17000.0000, 0.00, 17000.0000, 17000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(271, 21, 207, 312, 1.0000, 0.0000, 17000.0000, 0.00, 17000.0000, 17000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(272, 21, 207, 313, 1.0000, 0.0000, 17000.0000, 0.00, 17000.0000, 17000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(273, 21, 208, 314, 1.0000, 0.0000, 19000.0000, 0.00, 19000.0000, 19000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(274, 21, 208, 315, 1.0000, 0.0000, 19000.0000, 0.00, 19000.0000, 19000.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-21 23:17:48'),
(275, 21, 208, 316, 1.0000, 0.0000, 19000.0000, 0.00, 19000.0000, 19000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(276, 21, 209, 317, 1.0000, 0.0000, 17000.0000, 0.00, 17000.0000, 17000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(277, 21, 209, 318, 1.0000, 0.0000, 17000.0000, 0.00, 17000.0000, 17000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(278, 21, 209, 319, 1.0000, 0.0000, 17000.0000, 0.00, 17000.0000, 17000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:25'),
(279, 22, 210, 320, 1.0000, 0.0000, 17000.0000, 0.00, 17000.0000, 17000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-07 19:10:22'),
(280, 22, 211, 321, 2.0000, 0.0000, 14000.0000, 0.00, 14000.0000, 14000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-07 19:10:22'),
(281, 22, 212, 322, 1.0000, 0.0000, 9800.0000, 0.00, 9800.0000, 9800.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-07 19:10:22'),
(282, 22, 213, 323, 1.0000, 0.0000, 7500.0000, 0.00, 7500.0000, 7500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-07 19:10:22'),
(283, 22, 214, 324, 1.0000, 0.0000, 11800.0000, 0.00, 11800.0000, 11800.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-07 19:10:22'),
(284, 22, 215, 325, 1.0000, 0.0000, 9000.0000, 0.00, 9000.0000, 9000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-07 19:10:22'),
(285, 22, 216, 326, 1.0000, 0.0000, 22500.0000, 0.00, 22500.0000, 22500.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-08 17:25:11'),
(286, 22, 216, 326, 1.0000, 0.0000, 22500.0000, 0.00, 22500.0000, 22500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-07 19:10:22'),
(287, 22, 217, 327, 1.0000, 0.0000, 11000.0000, 0.00, 11000.0000, 11000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-07 19:10:22'),
(288, 22, 218, 328, 1.0000, 0.0000, 22500.0000, 0.00, 22500.0000, 22500.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-08 19:54:14'),
(289, 22, 219, 329, 2.0000, 0.0000, 8800.0000, 0.00, 8800.0000, 8800.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-07 19:10:22'),
(290, 22, 220, 330, 3.0000, 0.0000, 9500.0000, 0.00, 9500.0000, 9500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-07 19:10:22'),
(291, 22, 221, 331, 1.0000, 0.0000, 7200.0000, 0.00, 7200.0000, 7200.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-07 19:10:22'),
(292, 22, 222, 332, 1.0000, 0.0000, 20500.0000, 0.00, 20500.0000, 20500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-07 19:10:22'),
(293, 22, 223, 333, 1.0000, 0.0000, 14500.0000, 0.00, 14500.0000, 14500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-07 19:10:22'),
(294, 22, 224, 334, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-07 19:10:22'),
(295, 22, 225, 335, 1.0000, 0.0000, 18800.0000, 0.00, 18800.0000, 18800.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-07 19:10:22'),
(296, 22, 226, 336, 1.0000, 0.0000, 28000.0000, 0.00, 28000.0000, 28000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-07 19:10:22'),
(297, 22, 227, 337, 2.0000, 0.0000, 19200.0000, 0.00, 19200.0000, 19200.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-08 19:54:14'),
(298, 22, 228, 338, 2.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-07 19:10:22'),
(299, 22, 229, 339, 2.0000, 0.0000, 16000.0000, 0.00, 16000.0000, 16000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-07 19:10:22'),
(300, 23, 276, 450, 1.0000, 0.0000, 16000.0000, 0.00, 16000.0000, 16000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(301, 23, 276, 451, 1.0000, 0.0000, 16600.0000, 0.00, 16600.0000, 16600.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(302, 23, 276, 452, 1.0000, 0.0000, 16000.0000, 0.00, 16000.0000, 16000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(303, 23, 231, 343, 1.0000, 0.0000, 16800.0000, 0.00, 16800.0000, 16800.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(304, 23, 231, 344, 1.0000, 0.0000, 16800.0000, 0.00, 16800.0000, 16800.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(305, 23, 231, 345, 1.0000, 0.0000, 16800.0000, 0.00, 16800.0000, 16800.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(306, 23, 232, 346, 1.0000, 0.0000, 18800.0000, 0.00, 18800.0000, 18800.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(307, 23, 232, 347, 1.0000, 0.0000, 18800.0000, 0.00, 18800.0000, 18800.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(308, 23, 232, 348, 1.0000, 0.0000, 18800.0000, 0.00, 18800.0000, 18800.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(309, 23, 233, 349, 1.0000, 0.0000, 15500.0000, 0.00, 15500.0000, 15500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(310, 23, 233, 350, 1.0000, 0.0000, 15500.0000, 0.00, 15500.0000, 15500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(311, 23, 233, 351, 1.0000, 0.0000, 15500.0000, 0.00, 15500.0000, 15500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(312, 23, 234, 352, 1.0000, 0.0000, 20500.0000, 0.00, 20500.0000, 20500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(313, 23, 234, 353, 1.0000, 0.0000, 20500.0000, 0.00, 20500.0000, 20500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(314, 23, 234, 354, 1.0000, 0.0000, 20500.0000, 0.00, 20500.0000, 20500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(315, 23, 235, 355, 1.0000, 0.0000, 15400.0000, 0.00, 15400.0000, 15400.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(316, 23, 235, 356, 1.0000, 0.0000, 15400.0000, 0.00, 15400.0000, 15400.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(317, 23, 236, 357, 1.0000, 0.0000, 16800.0000, 0.00, 16800.0000, 16800.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(318, 24, 4, 12, 1.0000, 0.0000, 5000.0000, 0.00, 5000.0000, 5000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(319, 24, 4, 13, 1.0000, 0.0000, 5000.0000, 0.00, 5000.0000, 5000.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-21 23:45:11'),
(320, 24, 5, 14, 1.0000, 0.0000, 20000.0000, 0.00, 20000.0000, 20000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(321, 24, 6, 15, 1.0000, 0.0000, 4000.0000, 0.00, 4000.0000, 4000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(322, 24, 6, 16, 1.0000, 0.0000, 4000.0000, 0.00, 4000.0000, 4000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(323, 24, 6, 17, 1.0000, 0.0000, 4000.0000, 0.00, 4000.0000, 4000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(324, 24, 7, 18, 1.0000, 0.0000, 6500.0000, 0.00, 6500.0000, 6500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(325, 24, 8, 19, 1.0000, 0.0000, 6500.0000, 0.00, 6500.0000, 6500.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-31 20:28:29'),
(326, 24, 9, 20, 1.0000, 0.0000, 16000.0000, 0.00, 16000.0000, 16000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(327, 24, 9, 21, 1.0000, 0.0000, 16000.0000, 0.00, 16000.0000, 16000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(328, 24, 9, 22, 1.0000, 0.0000, 16000.0000, 0.00, 16000.0000, 16000.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-31 20:28:28'),
(329, 24, 9, 23, 1.0000, 0.0000, 16000.0000, 0.00, 16000.0000, 16000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(330, 24, 10, 24, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(331, 24, 11, 25, 1.0000, 0.0000, 12000.0000, 0.00, 12000.0000, 12000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(332, 24, 11, 26, 1.0000, 0.0000, 12000.0000, 0.00, 12000.0000, 12000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(333, 24, 11, 27, 1.0000, 0.0000, 12000.0000, 0.00, 12000.0000, 12000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(334, 24, 277, 453, 2.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(335, 24, 277, 454, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(336, 24, 13, 31, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(337, 24, 13, 32, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-30 01:53:24'),
(338, 24, 14, 33, 1.0000, 0.0000, 13000.0000, 0.00, 13000.0000, 13000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(339, 24, 15, 34, 1.0000, 0.0000, 9000.0000, 0.00, 9000.0000, 9000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(340, 24, 16, 35, 1.0000, 0.0000, 3500.0000, 0.00, 3500.0000, 3500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(341, 24, 18, 37, 1.0000, 0.0000, 3500.0000, 0.00, 3500.0000, 3500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(342, 24, 18, 38, 1.0000, 0.0000, 3500.0000, 0.00, 3500.0000, 3500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(343, 24, 19, 39, 1.0000, 0.0000, 9500.0000, 0.00, 9500.0000, 9500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(344, 24, 19, 40, 1.0000, 0.0000, 9500.0000, 0.00, 9500.0000, 9500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(345, 24, 20, 41, 1.0000, 0.0000, 9500.0000, 0.00, 9500.0000, 9500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(346, 24, 21, 42, 1.0000, 0.0000, 4000.0000, 0.00, 4000.0000, 4000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(347, 24, 21, 43, 1.0000, 0.0000, 4000.0000, 0.00, 4000.0000, 4000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(348, 24, 22, 44, 1.0000, 0.0000, 6000.0000, 0.00, 6000.0000, 6000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(349, 24, 22, 45, 1.0000, 0.0000, 6000.0000, 0.00, 6000.0000, 6000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(350, 24, 22, 46, 1.0000, 0.0000, 6000.0000, 0.00, 6000.0000, 6000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(351, 24, 22, 47, 1.0000, 0.0000, 6000.0000, 0.00, 6000.0000, 6000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(352, 24, 22, 48, 1.0000, 0.0000, 6000.0000, 0.00, 6000.0000, 6000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(353, 24, 22, 49, 1.0000, 0.0000, 6000.0000, 0.00, 6000.0000, 6000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(354, 24, 23, 50, 2.0000, 0.0000, 8000.0000, 0.00, 8000.0000, 8000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(355, 24, 23, 51, 1.0000, 0.0000, 8000.0000, 0.00, 8000.0000, 8000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(356, 24, 24, 52, 1.0000, 0.0000, 6000.0000, 0.00, 6000.0000, 6000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(357, 24, 25, 53, 1.0000, 0.0000, 9000.0000, 0.00, 9000.0000, 9000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(358, 24, 26, 54, 2.0000, 0.0000, 9000.0000, 0.00, 9000.0000, 9000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(359, 24, 26, 55, 2.0000, 0.0000, 9000.0000, 0.00, 9000.0000, 9000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(360, 24, 27, 56, 1.0000, 0.0000, 12000.0000, 0.00, 12000.0000, 12000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(361, 24, 28, 57, 2.0000, 0.0000, 7000.0000, 0.00, 7000.0000, 7000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(362, 24, 29, 58, 1.0000, 0.0000, 9000.0000, 0.00, 9000.0000, 9000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(363, 24, 29, 59, 1.0000, 0.0000, 9000.0000, 0.00, 9000.0000, 9000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(364, 24, 30, 60, 1.0000, 0.0000, 5800.0000, 0.00, 5800.0000, 5800.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(365, 24, 30, 61, 1.0000, 0.0000, 5800.0000, 0.00, 5800.0000, 5800.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(366, 24, 30, 62, 1.0000, 0.0000, 5800.0000, 0.00, 5800.0000, 5800.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(367, 24, 30, 63, 1.0000, 0.0000, 5800.0000, 0.00, 5800.0000, 5800.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(368, 25, 31, 64, 1.0000, 0.0000, 16900.0000, 0.00, 16900.0000, 16900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(369, 25, 31, 65, 1.0000, 0.0000, 16900.0000, 0.00, 16900.0000, 16900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(370, 25, 32, 66, 1.0000, 0.0000, 19900.0000, 0.00, 19900.0000, 19900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(371, 25, 32, 67, 1.0000, 0.0000, 19900.0000, 0.00, 19900.0000, 19900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(372, 25, 33, 68, 1.0000, 0.0000, 17900.0000, 0.00, 17900.0000, 17900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(373, 25, 33, 69, 1.0000, 0.0000, 17900.0000, 0.00, 17900.0000, 17900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(374, 25, 33, 70, 1.0000, 0.0000, 17900.0000, 0.00, 17900.0000, 17900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(375, 25, 34, 71, 1.0000, 0.0000, 13900.0000, 0.00, 13900.0000, 13900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(376, 25, 34, 72, 1.0000, 0.0000, 13900.0000, 0.00, 13900.0000, 13900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(377, 25, 35, 73, 1.0000, 0.0000, 13900.0000, 0.00, 13900.0000, 13900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(378, 25, 36, 74, 1.0000, 0.0000, 13900.0000, 0.00, 13900.0000, 13900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(379, 25, 36, 75, 1.0000, 0.0000, 13900.0000, 0.00, 13900.0000, 13900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(380, 25, 37, 76, 1.0000, 0.0000, 13900.0000, 0.00, 13900.0000, 13900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(381, 25, 37, 77, 1.0000, 0.0000, 13900.0000, 0.00, 13900.0000, 13900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(382, 25, 38, 78, 2.0000, 0.0000, 14900.0000, 0.00, 14900.0000, 14900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(383, 25, 39, 79, 1.0000, 0.0000, 14900.0000, 0.00, 14900.0000, 14900.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(384, 26, 237, 358, 1.0000, 0.0000, 25000.0000, 0.00, 25000.0000, 25000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(385, 26, 238, 359, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(386, 26, 238, 360, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(387, 26, 238, 361, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(388, 26, 238, 362, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(389, 26, 239, 363, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(390, 26, 239, 364, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(391, 26, 239, 365, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(392, 26, 239, 366, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-30 01:44:08'),
(393, 26, 240, 367, 1.0000, 0.0000, 28000.0000, 0.00, 28000.0000, 28000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(394, 26, 240, 368, 1.0000, 0.0000, 28000.0000, 0.00, 28000.0000, 28000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(395, 26, 241, 369, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(396, 26, 241, 370, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(397, 26, 241, 371, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(398, 26, 241, 372, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(399, 26, 242, 373, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(400, 26, 242, 374, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(401, 26, 243, 375, 1.0000, 0.0000, 20000.0000, 0.00, 20000.0000, 20000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(402, 26, 243, 376, 1.0000, 0.0000, 20000.0000, 0.00, 20000.0000, 20000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(403, 26, 244, 377, 1.0000, 0.0000, 20000.0000, 0.00, 20000.0000, 20000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(404, 26, 244, 378, 1.0000, 0.0000, 20000.0000, 0.00, 20000.0000, 20000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(405, 26, 245, 379, 1.0000, 0.0000, 20000.0000, 0.00, 20000.0000, 20000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(406, 26, 245, 380, 1.0000, 0.0000, 20000.0000, 0.00, 20000.0000, 20000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(407, 26, 246, 381, 1.0000, 0.0000, 20000.0000, 0.00, 20000.0000, 20000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(408, 26, 246, 382, 1.0000, 0.0000, 20000.0000, 0.00, 20000.0000, 20000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(409, 26, 246, 383, 1.0000, 0.0000, 20000.0000, 0.00, 20000.0000, 20000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(410, 26, 247, 384, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(411, 26, 248, 385, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(412, 26, 248, 386, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(413, 26, 248, 387, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(414, 26, 249, 388, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(415, 26, 249, 389, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-21 23:37:22'),
(416, 26, 249, 390, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(417, 26, 250, 391, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(418, 26, 250, 392, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(419, 26, 250, 393, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(420, 26, 251, 394, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(421, 26, 251, 395, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(422, 26, 252, 396, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(423, 26, 252, 397, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(424, 26, 252, 398, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(425, 26, 253, 399, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(426, 26, 253, 400, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(427, 26, 254, 401, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(428, 26, 254, 402, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(429, 26, 255, 403, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(430, 26, 255, 404, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-30 01:44:08'),
(431, 26, 256, 405, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-21 23:37:22'),
(432, 26, 256, 406, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(433, 26, 257, 407, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(434, 26, 257, 408, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(435, 26, 257, 409, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(436, 26, 258, 410, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(437, 26, 258, 411, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(438, 33, 278, 455, 1.0000, 0.0000, 16000.0000, 0.00, 16000.0000, 16000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-21 23:36:22', '2025-12-21 23:36:22'),
(439, 34, 278, 456, 1.0000, 0.0000, 16000.0000, 0.00, 16000.0000, 16000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-21 23:36:22', '2025-12-21 23:36:22'),
(440, 35, 278, 457, 1.0000, 0.0000, 16000.0000, 0.00, 16000.0000, 16000.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-21 23:36:22', '2025-12-21 23:37:22'),
(441, 38, 269, 438, 2.0000, 0.0000, 5500.0000, 0.00, 5500.0000, 5500.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-22 00:24:26', '2025-12-22 00:24:56'),
(442, 39, 279, 458, 3.0000, 0.0000, 10000.0000, 0.00, 10000.0000, 10000.0000, 0.0000, NULL, NULL, NULL, 1.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-22 01:16:01', '2025-12-30 01:53:24'),
(443, 40, 241, 459, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-22 01:34:15', '2025-12-22 01:34:15'),
(444, 41, 250, 460, 1.0000, 0.0000, 15000.0000, 0.00, 15000.0000, 15000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-22 02:16:00', '2025-12-22 02:16:00'),
(445, 42, 280, 461, 1.0000, 0.0000, 16500.0000, 0.00, 16500.0000, 16500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(446, 42, 280, 462, 1.0000, 0.0000, 16500.0000, 0.00, 16500.0000, 16500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(447, 42, 280, 463, 1.0000, 0.0000, 16500.0000, 0.00, 16500.0000, 16500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(448, 42, 280, 464, 1.0000, 0.0000, 16500.0000, 0.00, 16500.0000, 16500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(449, 42, 280, 465, 1.0000, 0.0000, 16500.0000, 0.00, 16500.0000, 16500.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(450, 42, 281, 466, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(451, 42, 281, 467, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(452, 42, 281, 468, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(453, 42, 281, 469, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(454, 42, 281, 470, 1.0000, 0.0000, 18000.0000, 0.00, 18000.0000, 18000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(455, 42, 282, 471, 1.0000, 0.0000, 21000.0000, 0.00, 21000.0000, 21000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(456, 42, 282, 472, 1.0000, 0.0000, 21000.0000, 0.00, 21000.0000, 21000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(457, 42, 282, 473, 1.0000, 0.0000, 21000.0000, 0.00, 21000.0000, 21000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(458, 42, 282, 474, 1.0000, 0.0000, 21000.0000, 0.00, 21000.0000, 21000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(459, 42, 282, 475, 1.0000, 0.0000, 21000.0000, 0.00, 21000.0000, 21000.0000, 0.0000, NULL, NULL, NULL, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, NULL, NULL, NULL, NULL, '2025-12-26 16:42:39', '2025-12-26 16:42:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reference_counts`
--

CREATE TABLE `reference_counts` (
  `id` int(10) UNSIGNED NOT NULL,
  `ref_type` varchar(191) NOT NULL,
  `ref_count` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reference_counts`
--

INSERT INTO `reference_counts` (`id`, `ref_type`, `ref_count`, `business_id`, `created_at`, `updated_at`) VALUES
(1, 'contacts', 26, 1, '2025-10-29 02:51:01', '2025-12-31 20:24:39'),
(2, 'business_location', 1, 1, '2025-10-29 02:51:02', '2025-10-29 02:51:02'),
(3, 'sell_payment', 16, 1, '2025-10-28 23:41:10', '2026-01-04 17:05:35'),
(4, 'sell_return', 2, 1, '2025-10-28 23:42:01', '2025-11-02 11:01:27'),
(5, 'purchase', 16, 1, '2025-12-02 23:21:19', '2025-12-26 16:42:38'),
(6, 'purchase_payment', 16, 1, '2025-12-02 23:21:38', '2025-12-26 16:44:28');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `res_product_modifier_sets`
--

CREATE TABLE `res_product_modifier_sets` (
  `modifier_set_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL COMMENT 'Table use to store the modifier sets applicable for a product'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `res_tables`
--

CREATE TABLE `res_tables` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `location_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `guard_name` varchar(191) NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `is_service_staff` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `name`, `guard_name`, `business_id`, `is_default`, `is_service_staff`, `created_at`, `updated_at`) VALUES
(1, 'Admin#1', 'web', 1, 1, 0, '2025-10-29 02:51:01', '2025-10-29 02:51:01'),
(2, 'Cashier#1', 'web', 1, 0, 0, '2025-10-29 02:51:01', '2025-10-29 02:51:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `role_has_permissions`
--

CREATE TABLE `role_has_permissions` (
  `permission_id` int(10) UNSIGNED NOT NULL,
  `role_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `role_has_permissions`
--

INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES
(25, 2),
(26, 2),
(48, 2),
(49, 2),
(50, 2),
(51, 2),
(80, 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `selling_price_groups`
--

CREATE TABLE `selling_price_groups` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `selling_price_groups`
--

INSERT INTO `selling_price_groups` (`id`, `name`, `description`, `business_id`, `is_active`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 'Efectivo', NULL, 1, 1, NULL, '2025-11-24 17:20:22', '2025-11-24 17:20:22');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sell_line_warranties`
--

CREATE TABLE `sell_line_warranties` (
  `sell_line_id` int(11) NOT NULL,
  `warranty_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(191) NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` text NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sheet_spreadsheets`
--

CREATE TABLE `sheet_spreadsheets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `sheet_data` longtext NOT NULL,
  `created_by` int(11) NOT NULL,
  `folder_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sheet_spreadsheet_shares`
--

CREATE TABLE `sheet_spreadsheet_shares` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `sheet_spreadsheet_id` bigint(20) UNSIGNED NOT NULL,
  `shared_with` varchar(191) NOT NULL COMMENT 'Shared with like user/role/todo',
  `shared_id` int(11) NOT NULL COMMENT 'Id of shared with like user_id/role_id/todo_id',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `stock_adjustments_temp`
--

CREATE TABLE `stock_adjustments_temp` (
  `id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `stock_adjustment_lines`
--

CREATE TABLE `stock_adjustment_lines` (
  `id` int(10) UNSIGNED NOT NULL,
  `transaction_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `variation_id` int(10) UNSIGNED NOT NULL,
  `quantity` decimal(22,4) NOT NULL,
  `secondary_unit_quantity` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `unit_price` decimal(22,4) DEFAULT NULL COMMENT 'Last purchase unit price',
  `removed_purchase_line` int(11) DEFAULT NULL,
  `lot_no_line_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `system`
--

CREATE TABLE `system` (
  `id` int(10) UNSIGNED NOT NULL,
  `key` varchar(191) NOT NULL,
  `value` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `system`
--

INSERT INTO `system` (`id`, `key`, `value`) VALUES
(1, 'db_version', '6.11'),
(2, 'default_business_active_status', '1'),
(4, 'crm_version', '2.1'),
(5, 'productcatalogue_version', '1.0'),
(6, 'essentials_version', '4.0'),
(7, 'connector_version', '2.0'),
(9, 'woocommerce_version', '5.1'),
(10, 'spreadsheet_version', '1.0');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tax_rates`
--

CREATE TABLE `tax_rates` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `amount` double(22,4) NOT NULL,
  `is_tax_group` tinyint(1) NOT NULL DEFAULT 0,
  `for_tax_group` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` int(10) UNSIGNED NOT NULL,
  `woocommerce_tax_rate_id` int(11) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `transactions`
--

CREATE TABLE `transactions` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `location_id` int(10) UNSIGNED DEFAULT NULL,
  `is_kitchen_order` tinyint(1) NOT NULL DEFAULT 0,
  `res_table_id` int(10) UNSIGNED DEFAULT NULL COMMENT 'fields to restaurant module',
  `res_waiter_id` int(10) UNSIGNED DEFAULT NULL COMMENT 'fields to restaurant module',
  `res_order_status` enum('received','cooked','served') DEFAULT NULL,
  `type` varchar(191) DEFAULT NULL,
  `sub_type` varchar(20) DEFAULT NULL,
  `status` varchar(191) NOT NULL,
  `sub_status` varchar(191) DEFAULT NULL,
  `is_quotation` tinyint(1) NOT NULL DEFAULT 0,
  `payment_status` enum('paid','due','partial') DEFAULT NULL,
  `adjustment_type` enum('normal','abnormal') DEFAULT NULL,
  `contact_id` int(11) UNSIGNED DEFAULT NULL,
  `customer_group_id` int(11) DEFAULT NULL COMMENT 'used to add customer group while selling',
  `invoice_no` varchar(191) DEFAULT NULL,
  `ref_no` varchar(191) DEFAULT NULL,
  `source` varchar(191) DEFAULT NULL,
  `subscription_no` varchar(191) DEFAULT NULL,
  `subscription_repeat_on` varchar(191) DEFAULT NULL,
  `transaction_date` datetime NOT NULL,
  `total_before_tax` decimal(22,4) NOT NULL DEFAULT 0.0000 COMMENT 'Total before the purchase/invoice tax, this includeds the indivisual product tax',
  `tax_id` int(10) UNSIGNED DEFAULT NULL,
  `tax_amount` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `discount_type` enum('fixed','percentage') DEFAULT NULL,
  `discount_amount` decimal(22,4) DEFAULT 0.0000,
  `rp_redeemed` int(11) NOT NULL DEFAULT 0 COMMENT 'rp is the short form of reward points',
  `rp_redeemed_amount` decimal(22,4) NOT NULL DEFAULT 0.0000 COMMENT 'rp is the short form of reward points',
  `shipping_details` varchar(191) DEFAULT NULL,
  `shipping_address` text DEFAULT NULL,
  `delivery_date` datetime DEFAULT NULL,
  `shipping_status` varchar(191) DEFAULT NULL,
  `delivered_to` varchar(191) DEFAULT NULL,
  `delivery_person` bigint(20) DEFAULT NULL,
  `shipping_charges` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `shipping_custom_field_1` varchar(191) DEFAULT NULL,
  `shipping_custom_field_2` varchar(191) DEFAULT NULL,
  `shipping_custom_field_3` varchar(191) DEFAULT NULL,
  `shipping_custom_field_4` varchar(191) DEFAULT NULL,
  `shipping_custom_field_5` varchar(191) DEFAULT NULL,
  `additional_notes` text DEFAULT NULL,
  `staff_note` text DEFAULT NULL,
  `is_export` tinyint(1) NOT NULL DEFAULT 0,
  `export_custom_fields_info` longtext DEFAULT NULL,
  `round_off_amount` decimal(22,4) NOT NULL DEFAULT 0.0000 COMMENT 'Difference of rounded total and actual total',
  `additional_expense_key_1` varchar(191) DEFAULT NULL,
  `additional_expense_value_1` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `additional_expense_key_2` varchar(191) DEFAULT NULL,
  `additional_expense_value_2` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `additional_expense_key_3` varchar(191) DEFAULT NULL,
  `additional_expense_value_3` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `additional_expense_key_4` varchar(191) DEFAULT NULL,
  `additional_expense_value_4` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `final_total` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `expense_category_id` int(10) UNSIGNED DEFAULT NULL,
  `expense_sub_category_id` int(11) DEFAULT NULL,
  `expense_for` int(10) UNSIGNED DEFAULT NULL,
  `commission_agent` int(11) DEFAULT NULL,
  `document` varchar(191) DEFAULT NULL,
  `is_direct_sale` tinyint(1) NOT NULL DEFAULT 0,
  `is_suspend` tinyint(1) NOT NULL DEFAULT 0,
  `exchange_rate` decimal(20,3) NOT NULL DEFAULT 1.000,
  `total_amount_recovered` decimal(22,4) DEFAULT NULL COMMENT 'Used for stock adjustment.',
  `transfer_parent_id` int(11) DEFAULT NULL,
  `return_parent_id` int(11) DEFAULT NULL,
  `opening_stock_product_id` int(11) DEFAULT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `essentials_duration` decimal(8,2) NOT NULL,
  `essentials_duration_unit` varchar(20) DEFAULT NULL,
  `essentials_amount_per_unit_duration` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `essentials_allowances` text DEFAULT NULL,
  `essentials_deductions` text DEFAULT NULL,
  `crm_is_order_request` tinyint(1) NOT NULL DEFAULT 0,
  `woocommerce_order_id` int(11) DEFAULT NULL,
  `purchase_requisition_ids` text DEFAULT NULL,
  `prefer_payment_method` varchar(191) DEFAULT NULL,
  `prefer_payment_account` int(11) DEFAULT NULL,
  `sales_order_ids` text DEFAULT NULL,
  `purchase_order_ids` text DEFAULT NULL,
  `custom_field_1` varchar(191) DEFAULT NULL,
  `custom_field_2` varchar(191) DEFAULT NULL,
  `custom_field_3` varchar(191) DEFAULT NULL,
  `custom_field_4` varchar(191) DEFAULT NULL,
  `import_batch` int(11) DEFAULT NULL,
  `import_time` datetime DEFAULT NULL,
  `types_of_service_id` int(11) DEFAULT NULL,
  `packing_charge` decimal(22,4) DEFAULT NULL,
  `packing_charge_type` enum('fixed','percent') DEFAULT NULL,
  `service_custom_field_1` text DEFAULT NULL,
  `service_custom_field_2` text DEFAULT NULL,
  `service_custom_field_3` text DEFAULT NULL,
  `service_custom_field_4` text DEFAULT NULL,
  `service_custom_field_5` text DEFAULT NULL,
  `service_custom_field_6` text DEFAULT NULL,
  `is_created_from_api` tinyint(1) NOT NULL DEFAULT 0,
  `rp_earned` int(11) NOT NULL DEFAULT 0 COMMENT 'rp is the short form of reward points',
  `order_addresses` text DEFAULT NULL,
  `is_recurring` tinyint(1) NOT NULL DEFAULT 0,
  `recur_interval` double(22,4) DEFAULT NULL,
  `recur_interval_type` enum('days','months','years') DEFAULT NULL,
  `recur_repetitions` int(11) DEFAULT NULL,
  `recur_stopped_on` datetime DEFAULT NULL,
  `recur_parent_id` int(11) DEFAULT NULL,
  `invoice_token` varchar(191) DEFAULT NULL,
  `pay_term_number` int(11) DEFAULT NULL,
  `pay_term_type` enum('days','months') DEFAULT NULL,
  `selling_price_group_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `transactions`
--

INSERT INTO `transactions` (`id`, `business_id`, `location_id`, `is_kitchen_order`, `res_table_id`, `res_waiter_id`, `res_order_status`, `type`, `sub_type`, `status`, `sub_status`, `is_quotation`, `payment_status`, `adjustment_type`, `contact_id`, `customer_group_id`, `invoice_no`, `ref_no`, `source`, `subscription_no`, `subscription_repeat_on`, `transaction_date`, `total_before_tax`, `tax_id`, `tax_amount`, `discount_type`, `discount_amount`, `rp_redeemed`, `rp_redeemed_amount`, `shipping_details`, `shipping_address`, `delivery_date`, `shipping_status`, `delivered_to`, `delivery_person`, `shipping_charges`, `shipping_custom_field_1`, `shipping_custom_field_2`, `shipping_custom_field_3`, `shipping_custom_field_4`, `shipping_custom_field_5`, `additional_notes`, `staff_note`, `is_export`, `export_custom_fields_info`, `round_off_amount`, `additional_expense_key_1`, `additional_expense_value_1`, `additional_expense_key_2`, `additional_expense_value_2`, `additional_expense_key_3`, `additional_expense_value_3`, `additional_expense_key_4`, `additional_expense_value_4`, `final_total`, `expense_category_id`, `expense_sub_category_id`, `expense_for`, `commission_agent`, `document`, `is_direct_sale`, `is_suspend`, `exchange_rate`, `total_amount_recovered`, `transfer_parent_id`, `return_parent_id`, `opening_stock_product_id`, `created_by`, `essentials_duration`, `essentials_duration_unit`, `essentials_amount_per_unit_duration`, `essentials_allowances`, `essentials_deductions`, `crm_is_order_request`, `woocommerce_order_id`, `purchase_requisition_ids`, `prefer_payment_method`, `prefer_payment_account`, `sales_order_ids`, `purchase_order_ids`, `custom_field_1`, `custom_field_2`, `custom_field_3`, `custom_field_4`, `import_batch`, `import_time`, `types_of_service_id`, `packing_charge`, `packing_charge_type`, `service_custom_field_1`, `service_custom_field_2`, `service_custom_field_3`, `service_custom_field_4`, `service_custom_field_5`, `service_custom_field_6`, `is_created_from_api`, `rp_earned`, `order_addresses`, `is_recurring`, `recur_interval`, `recur_interval_type`, `recur_repetitions`, `recur_stopped_on`, `recur_parent_id`, `invoice_token`, `pay_term_number`, `pay_term_type`, `selling_price_group_id`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 0, NULL, NULL, NULL, 'opening_stock', NULL, 'received', NULL, 0, 'paid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-01 19:50:42', 250.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 750.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, 3, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-28 19:50:42', '2025-10-28 19:50:42'),
(2, 1, 1, 0, NULL, NULL, NULL, 'opening_stock', NULL, 'received', NULL, 0, 'paid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-01 19:50:42', 250.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 1000.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, 3, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-28 19:50:42', '2025-10-28 19:50:42'),
(3, 1, 1, 0, NULL, NULL, NULL, 'opening_stock', NULL, 'received', NULL, 0, 'paid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-01 19:50:42', 250.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 1000.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, 3, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-28 19:50:42', '2025-10-28 19:50:42'),
(4, 1, 1, 0, NULL, NULL, NULL, 'opening_stock', NULL, 'received', NULL, 0, 'paid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-01 19:50:42', 250.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 500.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, 3, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-28 19:50:42', '2025-10-28 19:50:42'),
(5, 1, 1, 0, NULL, NULL, NULL, 'opening_stock', NULL, 'received', NULL, 0, 'paid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-01 19:50:42', 250.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 250.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, 3, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-28 19:50:42', '2025-10-28 19:50:42'),
(6, 1, 1, 0, NULL, NULL, NULL, 'opening_stock', NULL, 'received', NULL, 0, 'paid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-01 19:50:58', 100.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 100.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, 2, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-28 19:50:58', '2025-10-28 19:50:58'),
(7, 1, 1, 0, NULL, NULL, NULL, 'opening_stock', NULL, 'received', NULL, 0, 'paid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-01 19:50:58', 100.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 200.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, 2, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-28 19:50:58', '2025-10-28 19:50:58'),
(12, 1, 1, 0, NULL, NULL, NULL, 'purchase', NULL, 'received', NULL, 0, 'paid', NULL, 3, NULL, NULL, 'PO2025/0001', NULL, NULL, NULL, '2025-12-02 23:10:00', 434000.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 434000.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-02 23:21:19', '2025-12-02 23:22:18'),
(13, 1, 1, 0, NULL, NULL, NULL, 'purchase', NULL, 'received', NULL, 0, 'paid', NULL, 4, NULL, NULL, 'PO2025/0002', NULL, NULL, NULL, '2025-12-02 23:23:00', 117900.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 8760.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 126660.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-02 23:32:08', '2025-12-02 23:32:25'),
(14, 1, 1, 0, NULL, NULL, NULL, 'purchase', NULL, 'received', NULL, 0, 'paid', NULL, 5, NULL, NULL, 'PO2025/0003', NULL, NULL, NULL, '2025-12-02 23:33:00', 192000.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 192000.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-02 23:36:39', '2025-12-26 16:44:19'),
(15, 1, 1, 0, NULL, NULL, NULL, 'purchase', NULL, 'received', NULL, 0, 'paid', NULL, 6, NULL, NULL, 'PO2025/0004', NULL, NULL, NULL, '2025-12-02 23:38:00', 285365.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 285365.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-02 23:45:18', '2025-12-26 16:44:28'),
(16, 1, 1, 0, NULL, NULL, NULL, 'purchase', NULL, 'received', NULL, 0, 'paid', NULL, 7, NULL, NULL, 'PO2025/0005', NULL, NULL, NULL, '2025-12-02 23:45:00', 467500.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 38280.2000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 505780.2000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-03 00:03:27', '2025-12-26 16:44:10'),
(17, 1, 1, 0, NULL, NULL, NULL, 'purchase', NULL, 'received', NULL, 0, 'paid', NULL, 8, NULL, NULL, 'PO2025/0006', NULL, NULL, NULL, '2025-12-06 09:37:00', 567100.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 567100.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-06 09:41:42', '2025-12-26 16:44:01'),
(18, 1, 1, 0, NULL, NULL, NULL, 'purchase', NULL, 'received', NULL, 0, 'paid', NULL, 9, NULL, NULL, 'PO2025/0007', NULL, NULL, NULL, '2025-12-06 10:02:00', 565219.2000, NULL, 0.0000, 'fixed', 6250.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 18958.8400, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 577928.0400, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-06 10:12:08', '2025-12-06 10:12:46'),
(19, 1, 1, 0, NULL, NULL, NULL, 'purchase', NULL, 'received', NULL, 0, 'paid', NULL, 10, NULL, NULL, 'PO2025/0008', NULL, NULL, NULL, '2025-12-06 10:16:00', 469612.0000, NULL, 0.0000, 'fixed', 94022.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 3000.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 378590.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-06 10:21:33', '2025-12-26 16:43:53'),
(20, 1, 1, 0, NULL, NULL, NULL, 'purchase', NULL, 'received', NULL, 0, 'paid', NULL, 11, NULL, NULL, 'PO2025/0009', NULL, NULL, NULL, '2025-12-06 10:27:00', 522600.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 522600.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-06 10:53:38', '2025-12-26 16:43:45'),
(21, 1, 1, 0, NULL, NULL, NULL, 'purchase', NULL, 'received', NULL, 0, 'paid', NULL, 12, NULL, NULL, 'PO2025/0010', NULL, NULL, NULL, '2025-12-07 15:55:00', 491000.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 2500.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 493500.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-07 19:00:25', '2025-12-07 19:00:46'),
(22, 1, 1, 0, NULL, NULL, NULL, 'purchase', NULL, 'received', NULL, 0, 'paid', NULL, 13, NULL, NULL, 'PO2025/0011', NULL, NULL, NULL, '2025-12-07 16:03:00', 415100.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 415100.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-07 19:10:22', '2025-12-26 16:43:37'),
(23, 1, 1, 0, NULL, NULL, NULL, 'purchase', NULL, 'received', NULL, 0, 'paid', NULL, 14, NULL, NULL, 'PO2025/0012', NULL, NULL, NULL, '2025-12-07 17:03:00', 311000.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 311000.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-07 20:09:59', '2025-12-26 16:43:29'),
(24, 1, 1, 0, NULL, NULL, NULL, 'purchase', NULL, 'received', NULL, 0, 'paid', NULL, 15, NULL, NULL, 'PO2025/0013', NULL, NULL, NULL, '2025-12-07 17:14:00', 504200.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 504200.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-07 20:25:18', '2025-12-26 16:43:23'),
(25, 1, 1, 0, NULL, NULL, NULL, 'purchase', NULL, 'received', NULL, 0, 'paid', NULL, 11, NULL, NULL, 'PO2025/0014', NULL, NULL, NULL, '2025-12-07 17:36:00', 269300.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 269300.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-07 20:39:32', '2025-12-26 16:43:16'),
(26, 1, 1, 0, NULL, NULL, NULL, 'purchase', NULL, 'received', NULL, 0, 'paid', NULL, 16, NULL, NULL, 'PO2025/0015', NULL, NULL, NULL, '2025-12-07 18:14:00', 984000.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 984000.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-07 21:23:51', '2025-12-26 16:43:01'),
(27, 1, 1, 0, NULL, NULL, NULL, 'sell', NULL, 'final', NULL, 0, 'paid', NULL, 1, NULL, '0003', '', NULL, NULL, NULL, '2025-12-08 14:23:00', 38500.0000, NULL, 0.0000, 'percentage', 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 38500.0000, NULL, NULL, NULL, NULL, NULL, 1, 0, 1.000, NULL, NULL, NULL, NULL, 2, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 1.0000, 'days', 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-08 17:25:11', '2025-12-08 17:25:11'),
(28, 1, 1, 0, NULL, NULL, NULL, 'sell', NULL, 'final', NULL, 0, 'partial', NULL, 17, NULL, '0004', '', NULL, NULL, NULL, '2025-12-08 16:47:00', 127000.0000, NULL, 0.0000, 'percentage', 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 127000.0000, NULL, NULL, NULL, NULL, NULL, 1, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 1.0000, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-08 19:54:14', '2025-12-21 23:22:45'),
(29, 1, 1, 0, NULL, NULL, NULL, 'sell', NULL, 'final', NULL, 0, 'paid', NULL, 1, NULL, '0005', '', NULL, NULL, NULL, '2025-12-21 19:52:00', 30000.0000, NULL, 0.0000, 'percentage', 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 30000.0000, NULL, NULL, NULL, NULL, NULL, 1, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 1.0000, 'days', 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-21 22:54:08', '2025-12-21 22:54:08'),
(30, 1, 1, 0, NULL, NULL, NULL, 'sell', NULL, 'final', NULL, 0, 'paid', NULL, 1, NULL, '0006', '', NULL, NULL, NULL, '2025-12-21 19:54:00', 47800.0000, NULL, 0.0000, 'percentage', 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 47800.0000, NULL, NULL, NULL, NULL, NULL, 1, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 1.0000, 'days', 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-21 22:59:46', '2025-12-21 22:59:46'),
(31, 1, 1, 0, NULL, NULL, NULL, 'sell', NULL, 'final', NULL, 0, 'paid', NULL, 18, NULL, '0007', '', NULL, NULL, NULL, '2025-12-21 20:00:00', 122000.0000, NULL, 0.0000, 'percentage', 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 122000.0000, NULL, NULL, NULL, NULL, NULL, 1, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 1.0000, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-21 23:13:37', '2026-01-02 17:04:01'),
(32, 1, 1, 0, NULL, NULL, NULL, 'sell', NULL, 'final', NULL, 0, 'due', NULL, 19, NULL, '0008', '', NULL, NULL, NULL, '2025-12-21 20:13:00', 67000.0000, NULL, 0.0000, 'percentage', 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 67000.0000, NULL, NULL, NULL, NULL, NULL, 1, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 1.0000, 'days', 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-21 23:17:48', '2025-12-21 23:17:48'),
(33, 1, 1, 0, NULL, NULL, NULL, 'opening_stock', NULL, 'received', NULL, 0, 'paid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-01 20:36:21', 16000.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 16000.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, 278, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-21 23:36:22', '2025-12-21 23:36:22'),
(34, 1, 1, 0, NULL, NULL, NULL, 'opening_stock', NULL, 'received', NULL, 0, 'paid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-01 20:36:21', 16000.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 16000.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, 278, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-21 23:36:22', '2025-12-21 23:36:22'),
(35, 1, 1, 0, NULL, NULL, NULL, 'opening_stock', NULL, 'received', NULL, 0, 'paid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-01 20:36:21', 16000.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 16000.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, 278, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-21 23:36:22', '2025-12-21 23:36:22'),
(36, 1, 1, 0, NULL, NULL, NULL, 'sell', NULL, 'final', NULL, 0, 'partial', NULL, 20, NULL, '0009', '', NULL, NULL, NULL, '2025-12-21 20:24:00', 122000.0000, NULL, 0.0000, 'percentage', 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 122000.0000, NULL, NULL, NULL, NULL, NULL, 1, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 1.0000, 'days', 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-21 23:37:22', '2025-12-21 23:37:22'),
(37, 1, 1, 0, NULL, NULL, NULL, 'sell', NULL, 'final', NULL, 0, 'partial', NULL, 21, NULL, '0010', '', NULL, NULL, NULL, '2025-12-21 20:42:00', 80750.0000, NULL, 0.0000, 'percentage', 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 80750.0000, NULL, NULL, NULL, NULL, NULL, 1, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 1.0000, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-21 23:45:11', '2025-12-30 01:44:08'),
(38, 1, 1, 0, NULL, NULL, NULL, 'opening_stock', NULL, 'received', NULL, 0, 'paid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-01 21:24:26', 5500.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 11000.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, 269, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-22 00:24:26', '2025-12-22 00:24:26'),
(39, 1, 1, 0, NULL, NULL, NULL, 'opening_stock', NULL, 'received', NULL, 0, 'paid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-01 22:16:01', 10000.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 30000.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, 279, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-22 01:16:01', '2025-12-22 01:16:01'),
(40, 1, 1, 0, NULL, NULL, NULL, 'opening_stock', NULL, 'received', NULL, 0, 'paid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-01 22:34:15', 18000.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 18000.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, 241, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-22 01:34:15', '2025-12-22 01:34:15'),
(41, 1, 1, 0, NULL, NULL, NULL, 'opening_stock', NULL, 'received', NULL, 0, 'paid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-01 23:16:00', 15000.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 15000.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, 250, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-22 02:16:00', '2025-12-22 02:16:00'),
(42, 1, 1, 0, NULL, NULL, NULL, 'purchase', NULL, 'received', NULL, 0, 'paid', NULL, 8, NULL, NULL, 'PO2025/0016', NULL, NULL, NULL, '2025-12-26 13:41:00', 277500.0000, NULL, 0.0000, NULL, 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 3500.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 14100.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 295100.0000, NULL, NULL, NULL, NULL, NULL, 0, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-26 16:42:38', '2025-12-26 16:42:52'),
(43, 1, 1, 0, NULL, NULL, NULL, 'sell', NULL, 'final', NULL, 0, 'paid', NULL, 22, NULL, '0011', '', NULL, NULL, NULL, '2025-12-29 22:20:00', 36000.0000, NULL, 0.0000, 'percentage', 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 36000.0000, NULL, NULL, NULL, NULL, NULL, 1, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 1.0000, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-30 01:21:19', '2026-01-04 17:05:35'),
(44, 1, 1, 0, NULL, NULL, NULL, 'sell', NULL, 'final', NULL, 0, 'partial', NULL, 23, NULL, '0012', '', NULL, NULL, NULL, '2025-12-29 22:24:00', 134000.0000, NULL, 0.0000, 'percentage', 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 134000.0000, NULL, NULL, NULL, NULL, NULL, 1, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 1.0000, 'days', 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-30 01:32:36', '2025-12-30 01:32:36'),
(45, 1, 1, 0, NULL, NULL, NULL, 'sell', NULL, 'final', NULL, 0, 'due', NULL, 24, NULL, '0013', '', NULL, NULL, NULL, '2025-12-29 22:32:00', 82000.0000, NULL, 0.0000, 'percentage', 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 82000.0000, NULL, NULL, NULL, NULL, NULL, 1, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 1.0000, 'days', 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-30 01:38:54', '2025-12-30 01:38:54'),
(46, 1, 1, 0, NULL, NULL, NULL, 'sell', NULL, 'final', NULL, 0, 'partial', NULL, 25, NULL, '0014', '', NULL, NULL, NULL, '2025-12-29 22:44:00', 43000.0000, NULL, 0.0000, 'percentage', 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 43000.0000, NULL, NULL, NULL, NULL, NULL, 1, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 1.0000, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-30 01:53:24', '2025-12-30 01:53:41'),
(47, 1, 1, 0, NULL, NULL, NULL, 'sell', NULL, 'final', NULL, 0, 'partial', NULL, 26, NULL, '0015', '', NULL, NULL, NULL, '2025-12-31 17:24:00', 112000.0000, NULL, 0.0000, 'percentage', 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 112000.0000, NULL, NULL, NULL, NULL, NULL, 1, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 1.0000, 'days', 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-31 20:28:28', '2025-12-31 20:28:28'),
(48, 1, 1, 0, NULL, NULL, NULL, 'sell', NULL, 'final', NULL, 0, 'paid', NULL, 1, NULL, '0016', '', NULL, NULL, NULL, '2026-01-02 14:01:00', 40000.0000, NULL, 0.0000, 'percentage', 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 40000.0000, NULL, NULL, NULL, NULL, NULL, 1, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 1.0000, 'days', 0, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-02 17:03:20', '2026-01-02 17:03:20'),
(49, 1, 1, 0, NULL, NULL, NULL, 'sell', NULL, 'final', NULL, 0, 'paid', NULL, 1, NULL, '0017', '', NULL, NULL, NULL, '2026-01-03 13:20:00', 35000.0000, NULL, 0.0000, 'percentage', 0.0000, 0, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, NULL, 0.0000, 35000.0000, NULL, NULL, NULL, NULL, NULL, 1, 0, 1.000, NULL, NULL, NULL, NULL, 1, 0.00, NULL, 0.0000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.0000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 1.0000, 'days', 0, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-03 16:22:05', '2026-01-03 16:22:05');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `transaction_payments`
--

CREATE TABLE `transaction_payments` (
  `id` int(10) UNSIGNED NOT NULL,
  `transaction_id` int(11) UNSIGNED DEFAULT NULL,
  `business_id` int(11) DEFAULT NULL,
  `is_return` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Used during sales to return the change',
  `amount` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `method` varchar(191) DEFAULT NULL,
  `payment_type` varchar(191) DEFAULT NULL,
  `transaction_no` varchar(191) DEFAULT NULL,
  `card_transaction_number` varchar(191) DEFAULT NULL,
  `card_number` varchar(191) DEFAULT NULL,
  `card_type` varchar(191) DEFAULT NULL,
  `card_holder_name` varchar(191) DEFAULT NULL,
  `card_month` varchar(191) DEFAULT NULL,
  `card_year` varchar(191) DEFAULT NULL,
  `card_security` varchar(5) DEFAULT NULL,
  `cheque_number` varchar(191) DEFAULT NULL,
  `bank_account_number` varchar(191) DEFAULT NULL,
  `paid_on` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `paid_through_link` tinyint(1) NOT NULL DEFAULT 0,
  `gateway` varchar(191) DEFAULT NULL,
  `is_advance` tinyint(1) NOT NULL DEFAULT 0,
  `payment_for` int(11) DEFAULT NULL COMMENT 'stores the contact id',
  `parent_id` int(11) DEFAULT NULL,
  `note` varchar(191) DEFAULT NULL,
  `document` varchar(191) DEFAULT NULL,
  `payment_ref_no` varchar(191) DEFAULT NULL,
  `account_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `transaction_payments`
--

INSERT INTO `transaction_payments` (`id`, `transaction_id`, `business_id`, `is_return`, `amount`, `method`, `payment_type`, `transaction_no`, `card_transaction_number`, `card_number`, `card_type`, `card_holder_name`, `card_month`, `card_year`, `card_security`, `cheque_number`, `bank_account_number`, `paid_on`, `created_by`, `paid_through_link`, `gateway`, `is_advance`, `payment_for`, `parent_id`, `note`, `document`, `payment_ref_no`, `account_id`, `created_at`, `updated_at`) VALUES
(2, 12, 1, 0, 434000.0000, 'bank_transfer', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-02 23:21:00', 1, 0, NULL, 0, 3, NULL, NULL, NULL, 'PP2025/0001', NULL, '2025-12-02 23:21:38', '2025-12-02 23:21:38'),
(3, 13, 1, 0, 126660.0000, 'bank_transfer', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-02 23:32:00', 1, 0, NULL, 0, 4, NULL, NULL, NULL, 'PP2025/0002', NULL, '2025-12-02 23:32:25', '2025-12-02 23:32:25'),
(4, 18, 1, 0, 577928.0400, 'bank_transfer', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-06 10:12:00', 1, 0, NULL, 0, 9, NULL, NULL, NULL, 'PP2025/0003', NULL, '2025-12-06 10:12:46', '2025-12-06 10:12:46'),
(5, 21, 1, 0, 493500.0000, 'bank_transfer', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-07 16:00:00', 1, 0, NULL, 0, 12, NULL, NULL, NULL, 'PP2025/0004', NULL, '2025-12-07 19:00:40', '2025-12-07 19:00:40'),
(6, 27, 1, 0, 38500.0000, 'bank_transfer', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-08 14:23:00', 2, 0, NULL, 0, 1, NULL, NULL, NULL, 'SP2025/0002', NULL, '2025-12-08 17:25:11', '2025-12-08 17:25:11'),
(7, 29, 1, 0, 30000.0000, 'bank_transfer', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-21 19:52:00', 1, 0, NULL, 0, 1, NULL, NULL, NULL, 'SP2025/0003', NULL, '2025-12-21 22:54:08', '2025-12-21 22:54:08'),
(8, 30, 1, 0, 47800.0000, 'bank_transfer', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-21 19:54:00', 1, 0, NULL, 0, 1, NULL, NULL, NULL, 'SP2025/0004', NULL, '2025-12-21 22:59:46', '2025-12-21 22:59:46'),
(9, 31, 1, 0, 88000.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-21 20:00:00', 1, 0, NULL, 0, 18, NULL, NULL, NULL, 'SP2025/0005', NULL, '2025-12-21 23:13:37', '2025-12-22 00:24:56'),
(10, 28, 1, 0, 60000.0000, 'bank_transfer', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-21 20:20:00', 1, 0, NULL, 0, 17, NULL, NULL, NULL, 'SP2025/0006', NULL, '2025-12-21 23:20:25', '2025-12-21 23:22:45'),
(11, 36, 1, 0, 50000.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-21 20:24:00', 1, 0, NULL, 0, 20, NULL, NULL, NULL, 'SP2025/0007', NULL, '2025-12-21 23:37:22', '2025-12-21 23:37:22'),
(12, 37, 1, 0, 13000.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-21 20:42:00', 1, 0, NULL, 0, 21, NULL, NULL, NULL, 'SP2025/0008', NULL, '2025-12-21 23:45:11', '2025-12-30 01:44:08'),
(13, 42, 1, 0, 295100.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-26 13:42:00', 1, 0, NULL, 0, 8, NULL, NULL, NULL, 'PP2025/0005', NULL, '2025-12-26 16:42:52', '2025-12-26 16:42:52'),
(14, 26, 1, 0, 984000.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-26 13:42:00', 1, 0, NULL, 0, 16, NULL, NULL, NULL, 'PP2025/0006', NULL, '2025-12-26 16:43:01', '2025-12-26 16:43:01'),
(15, 25, 1, 0, 269300.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-26 13:43:00', 1, 0, NULL, 0, 11, NULL, NULL, NULL, 'PP2025/0007', NULL, '2025-12-26 16:43:16', '2025-12-26 16:43:16'),
(16, 24, 1, 0, 504200.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-26 13:43:00', 1, 0, NULL, 0, 15, NULL, NULL, NULL, 'PP2025/0008', NULL, '2025-12-26 16:43:23', '2025-12-26 16:43:23'),
(17, 23, 1, 0, 311000.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-26 13:43:00', 1, 0, NULL, 0, 14, NULL, NULL, NULL, 'PP2025/0009', NULL, '2025-12-26 16:43:29', '2025-12-26 16:43:29'),
(18, 22, 1, 0, 415100.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-26 13:43:00', 1, 0, NULL, 0, 13, NULL, NULL, NULL, 'PP2025/0010', NULL, '2025-12-26 16:43:37', '2025-12-26 16:43:37'),
(19, 20, 1, 0, 522600.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-26 13:43:00', 1, 0, NULL, 0, 11, NULL, NULL, NULL, 'PP2025/0011', NULL, '2025-12-26 16:43:45', '2025-12-26 16:43:45'),
(20, 19, 1, 0, 378590.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-26 13:43:00', 1, 0, NULL, 0, 10, NULL, NULL, NULL, 'PP2025/0012', NULL, '2025-12-26 16:43:53', '2025-12-26 16:43:53'),
(21, 17, 1, 0, 567100.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-26 13:43:00', 1, 0, NULL, 0, 8, NULL, NULL, NULL, 'PP2025/0013', NULL, '2025-12-26 16:44:01', '2025-12-26 16:44:01'),
(22, 16, 1, 0, 505780.2000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-26 13:44:00', 1, 0, NULL, 0, 7, NULL, NULL, NULL, 'PP2025/0014', NULL, '2025-12-26 16:44:10', '2025-12-26 16:44:10'),
(23, 14, 1, 0, 192000.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-26 13:44:00', 1, 0, NULL, 0, 5, NULL, NULL, NULL, 'PP2025/0015', NULL, '2025-12-26 16:44:19', '2025-12-26 16:44:19'),
(24, 15, 1, 0, 285365.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-26 13:44:00', 1, 0, NULL, 0, 6, NULL, NULL, NULL, 'PP2025/0016', NULL, '2025-12-26 16:44:28', '2025-12-26 16:44:28'),
(25, 43, 1, 0, 10000.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-29 22:20:00', 1, 0, NULL, 0, 22, NULL, NULL, NULL, 'SP2025/0009', NULL, '2025-12-30 01:21:19', '2025-12-30 01:24:03'),
(26, 44, 1, 0, 40000.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-29 22:24:00', 1, 0, NULL, 0, 23, NULL, NULL, NULL, 'SP2025/0010', NULL, '2025-12-30 01:32:36', '2025-12-30 01:32:36'),
(27, 46, 1, 0, 33000.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-29 22:44:00', 1, 0, NULL, 0, 25, NULL, NULL, NULL, 'SP2025/0011', NULL, '2025-12-30 01:53:24', '2025-12-30 01:53:41'),
(28, 47, 1, 0, 74000.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-31 17:24:00', 1, 0, NULL, 0, 26, NULL, NULL, NULL, 'SP2025/0012', NULL, '2025-12-31 20:28:28', '2025-12-31 20:28:28'),
(29, 48, 1, 0, 40000.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-02 14:01:00', 1, 0, NULL, 0, 1, NULL, NULL, NULL, 'SP2026/0013', NULL, '2026-01-02 17:03:20', '2026-01-02 17:03:20'),
(30, 31, 1, 0, 34000.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-02 14:03:00', 1, 0, NULL, 0, 18, NULL, NULL, NULL, 'SP2026/0014', NULL, '2026-01-02 17:04:01', '2026-01-02 17:04:01'),
(31, 49, 1, 0, 35000.0000, 'bank_transfer', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-03 13:20:00', 1, 0, NULL, 0, 1, NULL, NULL, NULL, 'SP2026/0015', NULL, '2026-01-03 16:22:05', '2026-01-03 16:22:05'),
(32, 43, 1, 0, 26000.0000, 'cash', NULL, NULL, NULL, NULL, 'credit', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-04 14:05:00', 1, 0, NULL, 0, 22, NULL, NULL, NULL, 'SP2026/0016', NULL, '2026-01-04 17:05:35', '2026-01-04 17:05:35');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `transaction_sell_lines`
--

CREATE TABLE `transaction_sell_lines` (
  `id` int(10) UNSIGNED NOT NULL,
  `transaction_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `variation_id` int(10) UNSIGNED NOT NULL,
  `quantity` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `secondary_unit_quantity` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `quantity_returned` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `unit_price_before_discount` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `unit_price` decimal(22,4) DEFAULT NULL COMMENT 'Sell price excluding tax',
  `line_discount_type` enum('fixed','percentage') DEFAULT NULL,
  `line_discount_amount` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `unit_price_inc_tax` decimal(22,4) DEFAULT NULL COMMENT 'Sell price including tax',
  `item_tax` decimal(22,4) NOT NULL COMMENT 'Tax for one quantity',
  `tax_id` int(10) UNSIGNED DEFAULT NULL,
  `discount_id` int(11) DEFAULT NULL,
  `lot_no_line_id` int(11) DEFAULT NULL,
  `sell_line_note` text DEFAULT NULL,
  `woocommerce_line_items_id` int(11) DEFAULT NULL,
  `so_line_id` int(11) DEFAULT NULL,
  `so_quantity_invoiced` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `res_service_staff_id` int(11) DEFAULT NULL,
  `res_line_order_status` varchar(191) DEFAULT NULL,
  `parent_sell_line_id` int(11) DEFAULT NULL,
  `children_type` varchar(191) NOT NULL DEFAULT '' COMMENT 'Type of children for the parent, like modifier or combo',
  `sub_unit_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `transaction_sell_lines`
--

INSERT INTO `transaction_sell_lines` (`id`, `transaction_id`, `product_id`, `variation_id`, `quantity`, `secondary_unit_quantity`, `quantity_returned`, `unit_price_before_discount`, `unit_price`, `line_discount_type`, `line_discount_amount`, `unit_price_inc_tax`, `item_tax`, `tax_id`, `discount_id`, `lot_no_line_id`, `sell_line_note`, `woocommerce_line_items_id`, `so_line_id`, `so_quantity_invoiced`, `res_service_staff_id`, `res_line_order_status`, `parent_sell_line_id`, `children_type`, `sub_unit_id`, `created_at`, `updated_at`) VALUES
(3, 27, 216, 326, 1.0000, 0.0000, 0.0000, 38500.0000, 38500.0000, 'fixed', 0.0000, 38500.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-08 17:25:11', '2025-12-08 17:25:11'),
(4, 28, 218, 328, 1.0000, 0.0000, 0.0000, 39000.0000, 39000.0000, 'fixed', 0.0000, 39000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-08 19:54:14', '2025-12-21 23:22:45'),
(5, 28, 227, 337, 1.0000, 0.0000, 0.0000, 39000.0000, 39000.0000, 'fixed', 0.0000, 39000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-08 19:54:14', '2025-12-21 23:22:45'),
(6, 28, 178, 266, 1.0000, 0.0000, 0.0000, 49000.0000, 49000.0000, 'fixed', 0.0000, 49000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-08 19:54:14', '2025-12-21 23:22:45'),
(7, 29, 54, 100, 1.0000, 0.0000, 0.0000, 30000.0000, 30000.0000, 'fixed', 0.0000, 30000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-21 22:54:08', '2025-12-21 22:54:08'),
(8, 30, 175, 263, 1.0000, 0.0000, 0.0000, 34800.0000, 34800.0000, 'fixed', 0.0000, 34800.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-21 22:59:46', '2025-12-21 22:59:46'),
(9, 30, 266, 431, 1.0000, 0.0000, 0.0000, 13000.0000, 13000.0000, 'fixed', 0.0000, 13000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-21 22:59:46', '2025-12-21 22:59:46'),
(10, 31, 269, 438, 3.0000, 0.0000, 0.0000, 12000.0000, 12000.0000, 'fixed', 0.0000, 12000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-21 23:13:37', '2025-12-22 00:24:56'),
(11, 31, 171, 259, 1.0000, 0.0000, 0.0000, 60000.0000, 60000.0000, 'fixed', 0.0000, 60000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-21 23:13:37', '2025-12-22 00:24:56'),
(12, 31, 262, 422, 2.0000, 0.0000, 0.0000, 13000.0000, 13000.0000, 'fixed', 0.0000, 13000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-21 23:13:37', '2025-12-22 00:24:56'),
(13, 32, 262, 420, 1.0000, 0.0000, 0.0000, 13000.0000, 13000.0000, 'fixed', 0.0000, 13000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-21 23:17:48', '2025-12-21 23:17:48'),
(14, 32, 208, 315, 1.0000, 0.0000, 0.0000, 37000.0000, 37000.0000, 'fixed', 0.0000, 37000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-21 23:17:48', '2025-12-21 23:17:48'),
(15, 32, 263, 424, 1.0000, 0.0000, 0.0000, 17000.0000, 17000.0000, 'fixed', 0.0000, 17000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-21 23:17:48', '2025-12-21 23:17:48'),
(16, 36, 169, 255, 1.0000, 0.0000, 0.0000, 32000.0000, 32000.0000, 'fixed', 0.0000, 32000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-21 23:37:22', '2025-12-21 23:37:22'),
(17, 36, 256, 405, 1.0000, 0.0000, 0.0000, 31000.0000, 31000.0000, 'fixed', 0.0000, 31000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-21 23:37:22', '2025-12-21 23:37:22'),
(18, 36, 249, 389, 1.0000, 0.0000, 0.0000, 31000.0000, 31000.0000, 'fixed', 0.0000, 31000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-21 23:37:22', '2025-12-21 23:37:22'),
(19, 36, 278, 457, 1.0000, 0.0000, 0.0000, 28000.0000, 28000.0000, 'fixed', 0.0000, 28000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-21 23:37:22', '2025-12-21 23:37:22'),
(20, 37, 262, 420, 1.0000, 0.0000, 0.0000, 13000.0000, 13000.0000, 'fixed', 0.0000, 13000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-21 23:45:11', '2025-12-30 01:44:08'),
(21, 37, 4, 13, 1.0000, 0.0000, 0.0000, 10000.0000, 10000.0000, 'fixed', 0.0000, 10000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-21 23:45:11', '2025-12-30 01:44:08'),
(22, 43, 60, 108, 1.0000, 0.0000, 0.0000, 20000.0000, 20000.0000, 'fixed', 0.0000, 20000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-30 01:21:19', '2025-12-30 01:24:03'),
(23, 43, 51, 97, 1.0000, 0.0000, 0.0000, 16000.0000, 16000.0000, 'fixed', 0.0000, 16000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-30 01:24:03', '2025-12-30 01:24:03'),
(24, 44, 263, 425, 1.0000, 0.0000, 0.0000, 19000.0000, 19000.0000, 'fixed', 0.0000, 19000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-30 01:32:36', '2025-12-30 01:32:36'),
(25, 44, 139, 219, 1.0000, 0.0000, 0.0000, 16000.0000, 16000.0000, 'fixed', 0.0000, 16000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-30 01:32:36', '2025-12-30 01:32:36'),
(26, 44, 69, 121, 1.0000, 0.0000, 0.0000, 25000.0000, 25000.0000, 'fixed', 0.0000, 25000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-30 01:32:36', '2025-12-30 01:32:36'),
(27, 44, 166, 251, 1.0000, 0.0000, 0.0000, 37000.0000, 37000.0000, 'fixed', 0.0000, 37000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-30 01:32:36', '2025-12-30 01:32:36'),
(28, 44, 161, 243, 1.0000, 0.0000, 0.0000, 37000.0000, 37000.0000, 'fixed', 0.0000, 37000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-30 01:32:36', '2025-12-30 01:32:36'),
(29, 45, 275, 447, 1.0000, 0.0000, 0.0000, 37000.0000, 37000.0000, 'fixed', 0.0000, 37000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-30 01:38:54', '2025-12-30 01:38:54'),
(30, 45, 69, 120, 1.0000, 0.0000, 0.0000, 32000.0000, 32000.0000, 'fixed', 0.0000, 32000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-30 01:38:54', '2025-12-30 01:38:54'),
(31, 45, 266, 430, 1.0000, 0.0000, 0.0000, 13000.0000, 13000.0000, 'fixed', 0.0000, 13000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-30 01:38:54', '2025-12-30 01:38:54'),
(32, 37, 255, 404, 1.0000, 0.0000, 0.0000, 31500.0000, 31500.0000, 'fixed', 0.0000, 31500.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-30 01:44:08', '2025-12-30 01:44:08'),
(33, 37, 239, 366, 1.0000, 0.0000, 0.0000, 26250.0000, 26250.0000, 'fixed', 0.0000, 26250.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-30 01:44:08', '2025-12-30 01:44:08'),
(34, 46, 13, 32, 1.0000, 0.0000, 0.0000, 13000.0000, 13000.0000, 'fixed', 0.0000, 13000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-30 01:53:24', '2025-12-30 01:53:41'),
(35, 46, 279, 458, 1.0000, 0.0000, 0.0000, 20000.0000, 20000.0000, 'fixed', 0.0000, 20000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-30 01:53:24', '2025-12-30 01:53:41'),
(36, 46, 140, 221, 1.0000, 0.0000, 0.0000, 10000.0000, 10000.0000, 'fixed', 0.0000, 10000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-30 01:53:24', '2025-12-30 01:53:41'),
(37, 47, 9, 22, 1.0000, 0.0000, 0.0000, 32000.0000, 32000.0000, 'fixed', 0.0000, 32000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-31 20:28:28', '2025-12-31 20:28:28'),
(38, 47, 77, 135, 1.0000, 0.0000, 0.0000, 24000.0000, 24000.0000, 'fixed', 0.0000, 24000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-31 20:28:28', '2025-12-31 20:28:28'),
(39, 47, 260, 415, 1.0000, 0.0000, 0.0000, 14000.0000, 14000.0000, 'fixed', 0.0000, 14000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-31 20:28:28', '2025-12-31 20:28:28'),
(40, 47, 259, 413, 1.0000, 0.0000, 0.0000, 16000.0000, 16000.0000, 'fixed', 0.0000, 16000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-31 20:28:28', '2025-12-31 20:28:28'),
(41, 47, 261, 419, 1.0000, 0.0000, 0.0000, 13000.0000, 13000.0000, 'fixed', 0.0000, 13000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-31 20:28:28', '2025-12-31 20:28:28'),
(42, 47, 8, 19, 1.0000, 0.0000, 0.0000, 13000.0000, 13000.0000, 'fixed', 0.0000, 13000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2025-12-31 20:28:28', '2025-12-31 20:28:28'),
(43, 48, 144, 226, 1.0000, 0.0000, 0.0000, 20000.0000, 20000.0000, 'fixed', 0.0000, 20000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2026-01-02 17:03:20', '2026-01-02 17:03:20'),
(44, 48, 148, 230, 1.0000, 0.0000, 0.0000, 20000.0000, 20000.0000, 'fixed', 0.0000, 20000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2026-01-02 17:03:20', '2026-01-02 17:03:20'),
(45, 49, 185, 274, 1.0000, 0.0000, 0.0000, 35000.0000, 35000.0000, 'fixed', 0.0000, 35000.0000, 0.0000, NULL, NULL, NULL, '', NULL, NULL, 0.0000, NULL, NULL, NULL, '', NULL, '2026-01-03 16:22:05', '2026-01-03 16:22:05');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `transaction_sell_lines_purchase_lines`
--

CREATE TABLE `transaction_sell_lines_purchase_lines` (
  `id` bigint(20) NOT NULL,
  `sell_line_id` int(10) UNSIGNED DEFAULT NULL COMMENT 'id from transaction_sell_lines',
  `stock_adjustment_line_id` int(10) UNSIGNED DEFAULT NULL COMMENT 'id from stock_adjustment_lines',
  `purchase_line_id` int(10) UNSIGNED NOT NULL COMMENT 'id from purchase_lines',
  `quantity` decimal(22,4) NOT NULL,
  `qty_returned` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `transaction_sell_lines_purchase_lines`
--

INSERT INTO `transaction_sell_lines_purchase_lines` (`id`, `sell_line_id`, `stock_adjustment_line_id`, `purchase_line_id`, `quantity`, `qty_returned`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, 7, 1.0000, 1.0000, '2025-10-28 23:41:10', '2025-10-28 23:46:22'),
(2, 2, NULL, 1, 1.0000, 1.0000, '2025-11-02 11:00:27', '2025-11-02 11:01:27'),
(3, 3, NULL, 285, 1.0000, 0.0000, '2025-12-08 17:25:11', '2025-12-08 17:25:11'),
(4, 4, NULL, 288, 1.0000, 0.0000, '2025-12-08 19:54:14', '2025-12-08 19:54:14'),
(5, 5, NULL, 297, 1.0000, 0.0000, '2025-12-08 19:54:14', '2025-12-08 19:54:14'),
(6, 6, NULL, 226, 1.0000, 0.0000, '2025-12-08 19:54:14', '2025-12-08 19:54:14'),
(7, 7, NULL, 59, 1.0000, 0.0000, '2025-12-21 22:54:08', '2025-12-21 22:54:08'),
(8, 8, NULL, 222, 1.0000, 0.0000, '2025-12-21 22:59:46', '2025-12-21 22:59:46'),
(9, 9, NULL, 27, 1.0000, 0.0000, '2025-12-21 22:59:46', '2025-12-21 22:59:46'),
(10, 10, NULL, 34, 2.0000, 0.0000, '2025-12-21 23:13:37', '2025-12-21 23:13:37'),
(11, 11, NULL, 218, 1.0000, 0.0000, '2025-12-21 23:13:37', '2025-12-21 23:13:37'),
(12, 12, NULL, 18, 2.0000, 0.0000, '2025-12-21 23:13:37', '2025-12-21 23:13:37'),
(13, 13, NULL, 16, 1.0000, 0.0000, '2025-12-21 23:17:48', '2025-12-21 23:17:48'),
(14, 14, NULL, 274, 1.0000, 0.0000, '2025-12-21 23:17:48', '2025-12-21 23:17:48'),
(15, 15, NULL, 20, 1.0000, 0.0000, '2025-12-21 23:17:48', '2025-12-21 23:17:48'),
(16, 16, NULL, 214, 1.0000, 0.0000, '2025-12-21 23:37:22', '2025-12-21 23:37:22'),
(17, 17, NULL, 431, 1.0000, 0.0000, '2025-12-21 23:37:22', '2025-12-21 23:37:22'),
(18, 18, NULL, 415, 1.0000, 0.0000, '2025-12-21 23:37:22', '2025-12-21 23:37:22'),
(19, 19, NULL, 440, 1.0000, 0.0000, '2025-12-21 23:37:22', '2025-12-21 23:37:22'),
(20, 20, NULL, 16, 1.0000, 0.0000, '2025-12-21 23:45:11', '2025-12-21 23:45:11'),
(21, 21, NULL, 319, 1.0000, 0.0000, '2025-12-21 23:45:11', '2025-12-21 23:45:11'),
(22, 10, NULL, 441, 1.0000, 0.0000, '2025-12-22 00:24:56', '2025-12-22 00:24:56'),
(23, 22, NULL, 67, 1.0000, 0.0000, '2025-12-30 01:21:19', '2025-12-30 01:21:19'),
(24, 23, NULL, 55, 1.0000, 0.0000, '2025-12-30 01:24:03', '2025-12-30 01:24:03'),
(25, 24, NULL, 21, 1.0000, 0.0000, '2025-12-30 01:32:36', '2025-12-30 01:32:36'),
(26, 25, NULL, 178, 1.0000, 0.0000, '2025-12-30 01:32:36', '2025-12-30 01:32:36'),
(27, 26, NULL, 80, 1.0000, 0.0000, '2025-12-30 01:32:36', '2025-12-30 01:32:36'),
(28, 27, NULL, 210, 1.0000, 0.0000, '2025-12-30 01:32:36', '2025-12-30 01:32:36'),
(29, 28, NULL, 202, 1.0000, 0.0000, '2025-12-30 01:32:36', '2025-12-30 01:32:36'),
(30, 29, NULL, 258, 1.0000, 0.0000, '2025-12-30 01:38:54', '2025-12-30 01:38:54'),
(31, 30, NULL, 79, 1.0000, 0.0000, '2025-12-30 01:38:54', '2025-12-30 01:38:54'),
(32, 31, NULL, 26, 1.0000, 0.0000, '2025-12-30 01:38:54', '2025-12-30 01:38:54'),
(33, 32, NULL, 430, 1.0000, 0.0000, '2025-12-30 01:44:08', '2025-12-30 01:44:08'),
(34, 33, NULL, 392, 1.0000, 0.0000, '2025-12-30 01:44:08', '2025-12-30 01:44:08'),
(35, 34, NULL, 337, 1.0000, 0.0000, '2025-12-30 01:53:24', '2025-12-30 01:53:24'),
(36, 35, NULL, 442, 1.0000, 0.0000, '2025-12-30 01:53:24', '2025-12-30 01:53:24'),
(37, 36, NULL, 180, 1.0000, 0.0000, '2025-12-30 01:53:24', '2025-12-30 01:53:24'),
(38, 37, NULL, 328, 1.0000, 0.0000, '2025-12-31 20:28:28', '2025-12-31 20:28:28'),
(39, 38, NULL, 94, 1.0000, 0.0000, '2025-12-31 20:28:29', '2025-12-31 20:28:29'),
(40, 39, NULL, 11, 1.0000, 0.0000, '2025-12-31 20:28:29', '2025-12-31 20:28:29'),
(41, 40, NULL, 9, 1.0000, 0.0000, '2025-12-31 20:28:29', '2025-12-31 20:28:29'),
(42, 41, NULL, 15, 1.0000, 0.0000, '2025-12-31 20:28:29', '2025-12-31 20:28:29'),
(43, 42, NULL, 325, 1.0000, 0.0000, '2025-12-31 20:28:29', '2025-12-31 20:28:29'),
(44, 43, NULL, 185, 1.0000, 0.0000, '2026-01-02 17:03:20', '2026-01-02 17:03:20'),
(45, 44, NULL, 189, 1.0000, 0.0000, '2026-01-02 17:03:20', '2026-01-02 17:03:20'),
(46, 45, NULL, 235, 1.0000, 0.0000, '2026-01-03 16:22:05', '2026-01-03 16:22:05');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `types_of_services`
--

CREATE TABLE `types_of_services` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `business_id` int(11) NOT NULL,
  `location_price_group` text DEFAULT NULL,
  `packing_charge` decimal(22,4) DEFAULT NULL,
  `packing_charge_type` enum('fixed','percent') DEFAULT NULL,
  `enable_custom_fields` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `units`
--

CREATE TABLE `units` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `actual_name` varchar(191) NOT NULL,
  `short_name` varchar(191) NOT NULL,
  `allow_decimal` tinyint(1) NOT NULL,
  `base_unit_id` int(11) DEFAULT NULL,
  `base_unit_multiplier` decimal(20,4) DEFAULT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `units`
--

INSERT INTO `units` (`id`, `business_id`, `actual_name`, `short_name`, `allow_decimal`, `base_unit_id`, `base_unit_multiplier`, `created_by`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'Unidades', 'U', 0, NULL, NULL, 1, NULL, '2025-10-29 02:51:02', '2025-11-09 10:24:54');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_type` varchar(191) NOT NULL DEFAULT 'user',
  `surname` char(10) DEFAULT NULL,
  `first_name` varchar(191) NOT NULL,
  `last_name` varchar(191) DEFAULT NULL,
  `username` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `password` varchar(191) DEFAULT NULL,
  `language` char(7) NOT NULL DEFAULT 'en',
  `contact_no` char(15) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `business_id` int(10) UNSIGNED DEFAULT NULL,
  `essentials_department_id` int(11) DEFAULT NULL,
  `essentials_designation_id` int(11) DEFAULT NULL,
  `essentials_salary` decimal(22,4) DEFAULT NULL,
  `essentials_pay_period` varchar(191) DEFAULT NULL,
  `essentials_pay_cycle` varchar(191) DEFAULT NULL,
  `available_at` datetime DEFAULT NULL COMMENT 'Service staff avilable at. Calculated from product preparation_time_in_minutes',
  `paused_at` datetime DEFAULT NULL COMMENT 'Service staff available time paused at, Will be nulled on resume.',
  `max_sales_discount_percent` decimal(5,2) DEFAULT NULL,
  `allow_login` tinyint(1) NOT NULL DEFAULT 1,
  `status` enum('active','inactive','terminated') NOT NULL DEFAULT 'active',
  `is_enable_service_staff_pin` tinyint(1) NOT NULL DEFAULT 0,
  `service_staff_pin` text DEFAULT NULL,
  `crm_contact_id` int(10) UNSIGNED DEFAULT NULL,
  `is_cmmsn_agnt` tinyint(1) NOT NULL DEFAULT 0,
  `cmmsn_percent` decimal(4,2) NOT NULL DEFAULT 0.00,
  `selected_contacts` tinyint(1) NOT NULL DEFAULT 0,
  `dob` date DEFAULT NULL,
  `gender` varchar(191) DEFAULT NULL,
  `marital_status` enum('married','unmarried','divorced') DEFAULT NULL,
  `blood_group` char(10) DEFAULT NULL,
  `contact_number` char(20) DEFAULT NULL,
  `alt_number` varchar(191) DEFAULT NULL,
  `family_number` varchar(191) DEFAULT NULL,
  `fb_link` varchar(191) DEFAULT NULL,
  `twitter_link` varchar(191) DEFAULT NULL,
  `social_media_1` varchar(191) DEFAULT NULL,
  `social_media_2` varchar(191) DEFAULT NULL,
  `permanent_address` text DEFAULT NULL,
  `current_address` text DEFAULT NULL,
  `guardian_name` varchar(191) DEFAULT NULL,
  `custom_field_1` varchar(191) DEFAULT NULL,
  `custom_field_2` varchar(191) DEFAULT NULL,
  `custom_field_3` varchar(191) DEFAULT NULL,
  `custom_field_4` varchar(191) DEFAULT NULL,
  `bank_details` longtext DEFAULT NULL,
  `id_proof_name` varchar(191) DEFAULT NULL,
  `id_proof_number` varchar(191) DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL COMMENT 'user primary work location',
  `crm_department` varchar(191) DEFAULT NULL COMMENT 'Contact person''s department',
  `crm_designation` varchar(191) DEFAULT NULL COMMENT 'Contact person''s designation',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `user_type`, `surname`, `first_name`, `last_name`, `username`, `email`, `password`, `language`, `contact_no`, `address`, `remember_token`, `business_id`, `essentials_department_id`, `essentials_designation_id`, `essentials_salary`, `essentials_pay_period`, `essentials_pay_cycle`, `available_at`, `paused_at`, `max_sales_discount_percent`, `allow_login`, `status`, `is_enable_service_staff_pin`, `service_staff_pin`, `crm_contact_id`, `is_cmmsn_agnt`, `cmmsn_percent`, `selected_contacts`, `dob`, `gender`, `marital_status`, `blood_group`, `contact_number`, `alt_number`, `family_number`, `fb_link`, `twitter_link`, `social_media_1`, `social_media_2`, `permanent_address`, `current_address`, `guardian_name`, `custom_field_1`, `custom_field_2`, `custom_field_3`, `custom_field_4`, `bank_details`, `id_proof_name`, `id_proof_number`, `location_id`, `crm_department`, `crm_designation`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 'user', NULL, 'Facundo', 'Gomez', 'facugmz', 'facu.gmz54@gmail.com', '$2y$10$/vwijiSOKzD94GEJb5hCUOtExshqHnJmPc/puhsUZUWhDciN6GfZm', 'es', NULL, NULL, 'bBvSBuDVCDchXwAa6zaYUR3yanbSQgJtLHNbNpCBnPnvRNEUlYVkNMdjheEp', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 'active', 0, NULL, NULL, 0, 0.00, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{\"account_holder_name\":null,\"account_number\":null,\"bank_name\":null,\"bank_code\":null,\"branch\":null,\"tax_payer_id\":null}', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-29 02:51:01', '2025-10-28 18:38:27'),
(2, 'user', NULL, 'Romina', 'Elvira', 'romina', 'valentino200716@gmail.com', '$2y$10$iYrpG6.W6ZcIr3sdX/cZaejUJHO8VcSKXgRaiegYdp.PkNdX/uBFK', 'es', NULL, NULL, 'b8pRksUuaAGbBHgDIhVEHkmXJ5gNJOyRll2s5TxzDw7WzUT78xzXqOhk02pt', 1, NULL, NULL, NULL, 'month', NULL, NULL, NULL, NULL, 1, 'active', 0, NULL, NULL, 0, 0.00, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{\"account_holder_name\":null,\"account_number\":null,\"bank_name\":null,\"bank_code\":null,\"branch\":null,\"tax_payer_id\":null}', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-24 17:25:40', '2025-12-08 17:26:17');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_contact_access`
--

CREATE TABLE `user_contact_access` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `contact_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `user_contact_access`
--

INSERT INTO `user_contact_access` (`id`, `user_id`, `contact_id`) VALUES
(1, 2, 17);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `variations`
--

CREATE TABLE `variations` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `sub_sku` varchar(191) DEFAULT NULL,
  `product_variation_id` int(10) UNSIGNED NOT NULL,
  `woocommerce_variation_id` int(11) DEFAULT NULL,
  `variation_value_id` int(11) DEFAULT NULL,
  `default_purchase_price` decimal(22,4) DEFAULT NULL,
  `dpp_inc_tax` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `profit_percent` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `default_sell_price` decimal(22,4) DEFAULT NULL,
  `sell_price_inc_tax` decimal(22,4) DEFAULT NULL COMMENT 'Sell price including tax',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `combo_variations` text DEFAULT NULL COMMENT 'Contains the combo variation details'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `variations`
--

INSERT INTO `variations` (`id`, `name`, `product_id`, `sub_sku`, `product_variation_id`, `woocommerce_variation_id`, `variation_value_id`, `default_purchase_price`, `dpp_inc_tax`, `profit_percent`, `default_sell_price`, `sell_price_inc_tax`, `created_at`, `updated_at`, `deleted_at`, `combo_variations`) VALUES
(12, 'S', 4, '0004-1', 4, 142, 1, 5000.0000, 5000.0000, 75.0000, 8750.0000, 8750.0000, '2025-11-15 19:23:36', '2025-12-27 22:41:51', NULL, NULL),
(13, 'M', 4, '0004-2', 4, 144, 2, 5000.0000, 5000.0000, 75.0000, 8750.0000, 8750.0000, '2025-11-15 19:23:36', '2025-12-27 22:41:51', NULL, NULL),
(14, 'S', 5, '0005-1', 5, 146, 1, 20000.0000, 20000.0000, 75.0000, 35000.0000, 35000.0000, '2025-11-15 19:26:09', '2025-12-27 22:41:58', NULL, NULL),
(15, 'Negro', 6, '0006-1', 6, 148, 7, 4000.0000, 4000.0000, 75.0000, 7000.0000, 7000.0000, '2025-11-15 19:28:40', '2025-12-27 22:42:22', NULL, NULL),
(16, 'Blanco', 6, '0006-2', 6, 150, 9, 4000.0000, 4000.0000, 75.0000, 7000.0000, 7000.0000, '2025-11-15 19:28:40', '2025-12-27 22:42:22', NULL, NULL),
(17, 'Crudo', 6, '0006-3', 7, 152, 15, 4000.0000, 4000.0000, 75.0000, 7000.0000, 7000.0000, '2025-11-15 19:29:56', '2025-12-27 22:42:22', NULL, NULL),
(18, 'DUMMY', 7, '0007', 8, NULL, NULL, 6500.0000, 6500.0000, 75.0000, 11375.0000, 11375.0000, '2025-11-15 19:31:19', '2025-12-27 22:32:30', NULL, '[]'),
(19, 'DUMMY', 8, '0008', 9, NULL, NULL, 6500.0000, 6500.0000, 75.0000, 11375.0000, 11375.0000, '2025-11-15 19:33:17', '2025-12-27 22:32:30', NULL, '[]'),
(20, 'Negro', 9, '0009-1', 10, 154, 7, 16000.0000, 16000.0000, 75.0000, 28000.0000, 28000.0000, '2025-11-15 19:36:40', '2025-12-27 22:43:03', NULL, NULL),
(21, 'Gris', 9, '0009-2', 10, 156, 10, 16000.0000, 16000.0000, 75.0000, 28000.0000, 28000.0000, '2025-11-15 19:36:40', '2025-12-27 22:43:03', NULL, NULL),
(22, 'Amarillo', 9, '0009-3', 10, 158, 11, 16000.0000, 16000.0000, 75.0000, 28000.0000, 28000.0000, '2025-11-15 19:36:40', '2025-12-27 22:43:03', NULL, NULL),
(23, 'Verde', 9, '0009-4', 10, 160, 12, 16000.0000, 16000.0000, 75.0000, 28000.0000, 28000.0000, '2025-11-15 19:36:40', '2025-12-27 22:43:03', NULL, NULL),
(24, 'M', 10, '0010-1', 11, 162, 2, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-11-15 19:38:22', '2025-12-27 22:43:11', NULL, NULL),
(25, 'S', 11, '0011-1', 12, 164, 1, 12000.0000, 12000.0000, 75.0000, 21000.0000, 21000.0000, '2025-11-15 19:40:35', '2025-12-27 22:43:49', NULL, NULL),
(26, 'M', 11, '0011-2', 12, 166, 2, 12000.0000, 12000.0000, 75.0000, 21000.0000, 21000.0000, '2025-11-15 19:40:35', '2025-12-27 22:43:49', NULL, NULL),
(27, 'L', 11, '0011-3', 12, 168, 3, 12000.0000, 12000.0000, 75.0000, 21000.0000, 21000.0000, '2025-11-15 19:40:35', '2025-12-27 22:43:49', NULL, NULL),
(31, 'M', 13, '0013-1', 14, 170, 2, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-11-15 20:02:19', '2025-12-27 22:44:03', NULL, NULL),
(32, 'L', 13, '0013-2', 14, 172, 3, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-11-15 20:02:19', '2025-12-27 22:44:03', NULL, NULL),
(33, 'DUMMY', 14, '0014', 15, NULL, NULL, 13000.0000, 13000.0000, 75.0000, 22750.0000, 22750.0000, '2025-11-15 20:03:15', '2025-12-27 22:32:30', NULL, '[]'),
(34, 'DUMMY', 15, '0015', 16, NULL, NULL, 9000.0000, 9000.0000, 75.0000, 15750.0000, 15750.0000, '2025-11-15 20:18:22', '2025-12-27 22:32:30', NULL, '[]'),
(35, 'DUMMY', 16, '0016', 17, NULL, NULL, 3500.0000, 3500.0000, 75.0000, 6125.0000, 6125.0000, '2025-11-15 20:24:09', '2025-12-27 22:32:30', NULL, '[]'),
(37, 'Lila', 18, '0018-1', 19, 174, 14, 3500.0000, 3500.0000, 75.0000, 6125.0000, 6125.0000, '2025-11-15 20:31:08', '2025-12-27 22:44:25', NULL, NULL),
(38, 'Celeste', 18, '0018-2', 19, 176, 18, 3500.0000, 3500.0000, 75.0000, 6125.0000, 6125.0000, '2025-11-15 20:31:08', '2025-12-27 22:44:25', NULL, NULL),
(39, 'Negro', 19, '0019-1', 20, 177, 7, 9500.0000, 9500.0000, 75.0000, 16625.0000, 16625.0000, '2025-11-15 20:33:58', '2025-12-27 22:44:26', NULL, NULL),
(40, 'Chocolate', 19, '0019-2', 20, 178, 19, 9500.0000, 9500.0000, 75.0000, 16625.0000, 16625.0000, '2025-11-15 20:33:58', '2025-12-27 22:44:26', NULL, NULL),
(41, 'DUMMY', 20, '0020', 21, NULL, NULL, 9500.0000, 9500.0000, 75.0000, 16625.0000, 16625.0000, '2025-11-15 20:37:39', '2025-12-27 22:32:30', NULL, '[]'),
(42, 'Negro', 21, '0021-1', 22, 180, 7, 4000.0000, 4000.0000, 75.0000, 7000.0000, 7000.0000, '2025-11-15 21:32:42', '2025-12-27 22:44:43', NULL, NULL),
(43, 'Crudo', 21, '0021-2', 22, 182, 15, 4000.0000, 4000.0000, 75.0000, 7000.0000, 7000.0000, '2025-11-15 21:32:42', '2025-12-27 22:44:43', NULL, NULL),
(44, 'Negro', 22, '0022-1', 23, 184, 7, 6000.0000, 6000.0000, 75.0000, 10500.0000, 10500.0000, '2025-11-15 21:54:27', '2025-12-27 22:45:25', NULL, NULL),
(45, 'Gris', 22, '0022-2', 23, 186, 10, 6000.0000, 6000.0000, 75.0000, 10500.0000, 10500.0000, '2025-11-15 21:54:27', '2025-12-27 22:45:25', NULL, NULL),
(46, 'Amarillo', 22, '0022-3', 23, 188, 11, 6000.0000, 6000.0000, 75.0000, 10500.0000, 10500.0000, '2025-11-15 21:54:27', '2025-12-27 22:45:25', NULL, NULL),
(47, 'Crudo', 22, '0022-4', 23, 190, 15, 6000.0000, 6000.0000, 75.0000, 10500.0000, 10500.0000, '2025-11-15 21:54:27', '2025-12-27 22:45:25', NULL, NULL),
(48, 'Chocolate', 22, '0022-5', 23, 192, 19, 6000.0000, 6000.0000, 75.0000, 10500.0000, 10500.0000, '2025-11-15 21:54:27', '2025-12-27 22:45:25', NULL, NULL),
(49, 'Marron claro', 22, '0022-6', 23, 193, 21, 6000.0000, 6000.0000, 75.0000, 10500.0000, 10500.0000, '2025-11-15 21:54:27', '2025-12-27 22:45:25', NULL, NULL),
(50, 'M', 23, '0023-1', 24, 194, 2, 8000.0000, 8000.0000, 75.0000, 14000.0000, 14000.0000, '2025-11-15 21:56:07', '2025-12-27 22:45:27', NULL, NULL),
(51, 'L', 23, '0023-2', 24, 195, 3, 8000.0000, 8000.0000, 75.0000, 14000.0000, 14000.0000, '2025-11-15 21:56:07', '2025-12-27 22:45:27', NULL, NULL),
(52, 'S', 24, '0024-1', 25, 196, 1, 6000.0000, 6000.0000, 75.0000, 10500.0000, 10500.0000, '2025-11-15 22:01:02', '2025-12-27 22:45:28', NULL, NULL),
(53, 'M', 25, '0025-1', 26, 197, 2, 9000.0000, 9000.0000, 75.0000, 15750.0000, 15750.0000, '2025-11-15 22:02:22', '2025-12-27 22:45:29', NULL, NULL),
(54, 'M', 26, '0026-1', 27, 198, 2, 9000.0000, 9000.0000, 75.0000, 15750.0000, 15750.0000, '2025-11-15 22:03:32', '2025-12-27 22:45:31', NULL, NULL),
(55, 'L', 26, '0026-2', 27, 199, 3, 9000.0000, 9000.0000, 75.0000, 15750.0000, 15750.0000, '2025-11-15 22:03:32', '2025-12-27 22:45:31', NULL, NULL),
(56, 'M', 27, '0027-1', 28, 200, 2, 12000.0000, 12000.0000, 75.0000, 21000.0000, 21000.0000, '2025-11-15 22:04:39', '2025-12-27 22:45:32', NULL, NULL),
(57, 'M', 28, '0028-1', 29, 201, 2, 7000.0000, 7000.0000, 75.0000, 12250.0000, 12250.0000, '2025-11-15 22:05:54', '2025-12-27 22:45:33', NULL, NULL),
(58, 'M', 29, '0029-1', 30, 202, 2, 9000.0000, 9000.0000, 75.0000, 15750.0000, 15750.0000, '2025-11-15 22:06:54', '2025-12-27 22:45:34', NULL, NULL),
(59, 'XL', 29, '0029-2', 30, 203, 4, 9000.0000, 9000.0000, 75.0000, 15750.0000, 15750.0000, '2025-11-15 22:06:54', '2025-12-27 22:45:34', NULL, NULL),
(60, 'Negro', 30, '0030-1', 31, 205, 7, 5800.0000, 5800.0000, 75.0000, 10150.0000, 10150.0000, '2025-11-15 22:10:39', '2025-12-27 22:46:10', NULL, NULL),
(61, 'Crudo', 30, '0030-2', 31, 207, 15, 5800.0000, 5800.0000, 75.0000, 10150.0000, 10150.0000, '2025-11-15 22:10:39', '2025-12-27 22:46:10', NULL, NULL),
(62, 'Chocolate', 30, '0030-3', 31, 209, 19, 5800.0000, 5800.0000, 75.0000, 10150.0000, 10150.0000, '2025-11-15 22:10:39', '2025-12-27 22:46:10', NULL, NULL),
(63, 'Natural', 30, '0030-4', 31, 211, 22, 5800.0000, 5800.0000, 75.0000, 10150.0000, 10150.0000, '2025-11-15 22:10:39', '2025-12-27 22:46:10', NULL, NULL),
(64, 'M', 31, '0031-1', 32, 212, 2, 16900.0000, 16900.0000, 75.0000, 29575.0000, 29575.0000, '2025-11-15 22:36:29', '2025-12-27 22:46:12', NULL, NULL),
(65, 'L', 31, '0031-2', 32, 213, 3, 16900.0000, 16900.0000, 75.0000, 29575.0000, 29575.0000, '2025-11-15 22:36:29', '2025-12-27 22:46:12', NULL, NULL),
(66, 'M', 32, '0032-1', 33, 214, 2, 19900.0000, 19900.0000, 75.0000, 34825.0000, 34825.0000, '2025-11-15 22:37:30', '2025-12-27 22:46:13', NULL, NULL),
(67, 'L', 32, '0032-2', 33, 215, 3, 19900.0000, 19900.0000, 75.0000, 34825.0000, 34825.0000, '2025-11-15 22:37:30', '2025-12-27 22:46:13', NULL, NULL),
(68, 'S', 33, '0033-1', 34, 216, 1, 17900.0000, 17900.0000, 75.0000, 31325.0000, 31325.0000, '2025-11-15 22:39:02', '2025-12-27 22:46:14', NULL, NULL),
(69, 'M', 33, '0033-2', 34, 217, 2, 17900.0000, 17900.0000, 75.0000, 31325.0000, 31325.0000, '2025-11-15 22:39:02', '2025-12-27 22:46:14', NULL, NULL),
(70, 'L', 33, '0033-3', 34, 218, 3, 17900.0000, 17900.0000, 75.0000, 31325.0000, 31325.0000, '2025-11-15 22:39:02', '2025-12-27 22:46:14', NULL, NULL),
(71, 'S', 34, '0034-1', 35, 219, 1, 13900.0000, 13900.0000, 75.0000, 24325.0000, 24325.0000, '2025-11-15 22:40:54', '2025-12-27 22:46:15', NULL, NULL),
(72, 'M', 34, '0034-2', 35, 220, 2, 13900.0000, 13900.0000, 75.0000, 24325.0000, 24325.0000, '2025-11-15 22:40:54', '2025-12-27 22:46:15', NULL, NULL),
(73, 'L', 35, '0035-1', 36, 221, 3, 13900.0000, 13900.0000, 75.0000, 24325.0000, 24325.0000, '2025-11-15 22:42:05', '2025-12-27 22:46:17', NULL, NULL),
(74, 'M', 36, '0036-1', 37, 222, 2, 13900.0000, 13900.0000, 75.0000, 24325.0000, 24325.0000, '2025-11-15 22:43:34', '2025-12-27 22:46:18', NULL, NULL),
(75, 'L', 36, '0036-2', 37, 223, 3, 13900.0000, 13900.0000, 75.0000, 24325.0000, 24325.0000, '2025-11-15 22:43:34', '2025-12-27 22:46:18', NULL, NULL),
(76, 'M', 37, '0037-1', 38, 224, 2, 13900.0000, 13900.0000, 75.0000, 24325.0000, 24325.0000, '2025-11-15 22:44:46', '2025-12-27 22:46:19', NULL, NULL),
(77, 'L', 37, '0037-2', 38, 225, 3, 13900.0000, 13900.0000, 75.0000, 24325.0000, 24325.0000, '2025-11-15 22:44:46', '2025-12-27 22:46:19', NULL, NULL),
(78, 'M', 38, '0038-1', 39, 226, 2, 14900.0000, 14900.0000, 75.0000, 26075.0000, 26075.0000, '2025-11-15 22:45:50', '2025-12-27 22:46:20', NULL, NULL),
(79, 'M', 39, '0039-1', 40, 227, 2, 14900.0000, 14900.0000, 75.0000, 26075.0000, 26075.0000, '2025-11-15 22:46:35', '2025-12-27 22:46:21', NULL, NULL),
(80, 'Negro', 40, '0040-1', 41, 228, 7, 3600.0000, 3600.0000, 75.0000, 6300.0000, 6300.0000, '2025-11-24 12:45:06', '2025-12-27 22:46:22', NULL, NULL),
(81, 'Blanco', 40, '0040-2', 41, 229, 9, 3600.0000, 3600.0000, 75.0000, 6300.0000, 6300.0000, '2025-11-24 12:45:06', '2025-12-27 22:46:22', NULL, NULL),
(82, 'Beige', 40, '0040-3', 41, 230, 17, 3600.0000, 3600.0000, 75.0000, 6300.0000, 6300.0000, '2025-11-24 12:45:06', '2025-12-27 22:46:22', NULL, NULL),
(83, 'Dorado', 41, '0041-1', 42, 231, 16, 7900.0000, 7900.0000, 75.0000, 13825.0000, 13825.0000, '2025-11-24 12:48:54', '2025-12-27 22:46:23', NULL, NULL),
(84, 'Beige', 42, '0042-1', 43, 232, 17, 6600.0000, 6600.0000, 75.0000, 11550.0000, 11550.0000, '2025-11-24 12:51:30', '2025-12-27 22:46:25', NULL, NULL),
(85, 'Chocolate', 42, '0042-2', 43, 233, 19, 6600.0000, 6600.0000, 75.0000, 11550.0000, 11550.0000, '2025-11-24 12:51:30', '2025-12-27 22:46:25', NULL, NULL),
(86, 'DUMMY', 43, '0043', 44, NULL, NULL, 9000.0000, 9000.0000, 75.0000, 15750.0000, 15750.0000, '2025-11-24 12:52:39', '2025-12-27 22:32:30', NULL, '[]'),
(87, 'DUMMY', 44, '0044', 45, NULL, NULL, 17500.0000, 17500.0000, 75.0000, 30625.0000, 30625.0000, '2025-11-24 12:59:57', '2025-12-27 22:32:30', NULL, '[]'),
(88, 'Negro', 45, '0045-1', 46, 234, 7, 5300.0000, 5300.0000, 75.0000, 9275.0000, 9275.0000, '2025-11-24 13:06:14', '2025-12-27 22:46:26', NULL, NULL),
(89, 'Blanco', 45, '0045-2', 46, 235, 9, 5300.0000, 5300.0000, 75.0000, 9275.0000, 9275.0000, '2025-11-24 13:06:14', '2025-12-27 22:46:26', NULL, NULL),
(90, 'DUMMY', 46, '0046', 47, NULL, NULL, 5800.0000, 5800.0000, 75.0000, 10150.0000, 10150.0000, '2025-11-24 13:07:48', '2025-12-27 22:32:30', NULL, '[]'),
(91, 'DUMMY', 47, '0047', 48, NULL, NULL, 8500.0000, 8500.0000, 75.0000, 14875.0000, 14875.0000, '2025-11-24 13:09:18', '2025-12-27 22:32:30', NULL, '[]'),
(92, 'DUMMY', 48, '0048', 49, NULL, NULL, 5400.0000, 5400.0000, 75.0000, 9450.0000, 9450.0000, '2025-11-24 13:11:05', '2025-12-27 22:32:30', NULL, '[]'),
(93, 'DUMMY', 49, '0049', 50, NULL, NULL, 6000.0000, 6000.0000, 75.0000, 10500.0000, 10500.0000, '2025-11-24 13:12:47', '2025-12-27 22:32:30', NULL, '[]'),
(94, 'Gris', 50, '0050-1', 51, 236, 10, 3600.0000, 3600.0000, 75.0000, 6300.0000, 6300.0000, '2025-11-24 13:15:24', '2025-12-27 22:46:27', NULL, NULL),
(95, 'Dorado', 50, '0050-2', 51, 237, 16, 3600.0000, 3600.0000, 75.0000, 6300.0000, 6300.0000, '2025-11-24 13:15:24', '2025-12-27 22:46:27', NULL, NULL),
(96, 'Negro', 51, '0051-1', 52, 238, 7, 8000.0000, 8000.0000, 75.0000, 14000.0000, 14000.0000, '2025-11-24 13:41:16', '2025-12-27 22:46:28', NULL, NULL),
(97, 'Beige', 51, '0051-2', 52, 239, 17, 8000.0000, 8000.0000, 75.0000, 14000.0000, 14000.0000, '2025-11-24 13:41:16', '2025-12-27 22:46:28', NULL, NULL),
(98, 'Marron', 52, '0052-1', 53, 240, 20, 9000.0000, 9000.0000, 75.0000, 15750.0000, 15750.0000, '2025-11-24 13:54:29', '2025-12-27 22:46:29', NULL, NULL),
(99, 'Negro', 53, '0053-1', 54, 241, 7, 16500.0000, 16500.0000, 75.0000, 28875.0000, 28875.0000, '2025-11-24 13:56:29', '2025-12-27 22:46:30', NULL, NULL),
(100, 'DUMMY', 54, '0054', 55, NULL, NULL, 16500.0000, 16500.0000, 75.0000, 28875.0000, 28875.0000, '2025-11-24 13:59:50', '2025-12-27 22:32:30', NULL, '[]'),
(101, 'DUMMY', 55, '0055', 56, NULL, NULL, 16500.0000, 16500.0000, 75.0000, 28875.0000, 28875.0000, '2025-11-24 14:01:24', '2025-12-27 22:32:30', NULL, '[]'),
(102, 'Amarillo', 56, '0056-1', 57, 242, 11, 9000.0000, 9000.0000, 75.0000, 15750.0000, 15750.0000, '2025-11-24 14:04:43', '2025-12-27 22:46:32', NULL, NULL),
(103, 'Rosado', 56, '0056-2', 57, 243, 13, 9000.0000, 9000.0000, 75.0000, 15750.0000, 15750.0000, '2025-11-24 14:04:43', '2025-12-27 22:46:32', NULL, NULL),
(104, 'Marron', 56, '0056-3', 57, 244, 20, 9000.0000, 9000.0000, 75.0000, 15750.0000, 15750.0000, '2025-11-24 14:04:43', '2025-12-27 22:46:32', NULL, NULL),
(105, 'DUMMY', 57, '0057', 58, NULL, NULL, 10000.0000, 10000.0000, 75.0000, 17500.0000, 17500.0000, '2025-11-24 14:11:15', '2025-12-27 22:32:30', NULL, '[]'),
(106, 'DUMMY', 58, '0058', 59, NULL, NULL, 9000.0000, 9000.0000, 75.0000, 15750.0000, 15750.0000, '2025-11-24 14:11:53', '2025-12-27 22:32:30', NULL, '[]'),
(107, 'Marron', 59, '0059-1', 60, 245, 20, 6000.0000, 6000.0000, 75.0000, 10500.0000, 10500.0000, '2025-11-24 14:15:57', '2025-12-27 22:46:33', NULL, NULL),
(108, 'Marron', 60, '0060-1', 61, 246, 20, 10000.0000, 10000.0000, 75.0000, 17500.0000, 17500.0000, '2025-11-24 14:17:39', '2025-12-27 22:46:34', NULL, NULL),
(109, 'Negro', 61, '0061-1', 62, 247, 7, 7500.0000, 7500.0000, 75.0000, 13125.0000, 13125.0000, '2025-11-24 14:24:54', '2025-12-27 22:46:35', NULL, NULL),
(110, 'Blanco', 61, '0061-2', 62, 248, 9, 7500.0000, 7500.0000, 75.0000, 13125.0000, 13125.0000, '2025-11-24 14:24:54', '2025-12-27 22:46:35', NULL, NULL),
(111, 'Beige', 62, '0062-1', 63, 249, 17, 12000.0000, 12000.0000, 75.0000, 21000.0000, 21000.0000, '2025-11-24 15:04:17', '2025-12-27 22:46:36', NULL, NULL),
(112, 'DUMMY', 63, '0063', 64, NULL, NULL, 12500.0000, 12500.0000, 75.0000, 21875.0000, 21875.0000, '2025-11-24 15:05:48', '2025-12-27 22:32:30', NULL, '[]'),
(113, 'DUMMY', 64, '0064', 65, NULL, NULL, 13000.0000, 13000.0000, 75.0000, 22750.0000, 22750.0000, '2025-11-24 15:06:55', '2025-12-27 22:32:30', NULL, '[]'),
(114, 'Gris', 65, '0065-1', 66, 250, 10, 7500.0000, 7500.0000, 75.0000, 13125.0000, 13125.0000, '2025-11-24 15:09:23', '2025-12-27 22:46:37', NULL, NULL),
(115, 'Marron', 65, '0065-2', 66, 251, 20, 7500.0000, 7500.0000, 75.0000, 13125.0000, 13125.0000, '2025-11-24 15:09:23', '2025-12-27 22:46:37', NULL, NULL),
(116, 'Negro', 66, '0066-1', 67, 252, 7, 4000.0000, 4000.0000, 75.0000, 7000.0000, 7000.0000, '2025-11-24 15:12:41', '2025-12-27 22:46:38', NULL, NULL),
(117, 'L', 67, '0067-1', 68, 253, 3, 13600.0000, 13600.0000, 75.0000, 23800.0000, 23800.0000, '2025-11-24 15:46:42', '2025-12-27 22:46:39', NULL, NULL),
(118, 'M', 68, '0068-1', 69, 254, 2, 15645.0000, 15645.0000, 75.0000, 27378.7500, 27378.7500, '2025-11-24 15:49:22', '2025-12-27 22:46:40', NULL, NULL),
(119, 'S', 69, '0069-1', 70, 255, 1, 12180.0000, 12180.0000, 75.0000, 21315.0000, 21315.0000, '2025-11-24 15:52:14', '2025-12-27 22:46:41', NULL, NULL),
(120, 'M', 69, '0069-2', 70, 256, 2, 12180.0000, 12180.0000, 75.0000, 21315.0000, 21315.0000, '2025-11-24 15:52:14', '2025-12-27 22:46:41', NULL, NULL),
(121, 'L', 69, '0069-3', 70, 257, 3, 12180.0000, 12180.0000, 75.0000, 21315.0000, 21315.0000, '2025-11-24 15:52:14', '2025-12-27 22:46:41', NULL, NULL),
(122, 'M', 70, '0070-1', 71, 258, 2, 5000.0000, 5000.0000, 75.0000, 8750.0000, 8750.0000, '2025-11-24 15:56:06', '2025-12-27 22:46:43', NULL, NULL),
(123, 'L', 70, '0070-2', 71, 259, 3, 5000.0000, 5000.0000, 75.0000, 8750.0000, 8750.0000, '2025-11-24 15:56:06', '2025-12-27 22:46:43', NULL, NULL),
(124, 'M', 71, '0071-1', 72, 260, 2, 9000.0000, 9000.0000, 75.0000, 15750.0000, 15750.0000, '2025-11-24 15:59:23', '2025-12-27 22:46:44', NULL, NULL),
(125, 'Negro', 72, '0072-1', 73, 261, 7, 13000.0000, 13000.0000, 75.0000, 22750.0000, 22750.0000, '2025-11-24 16:03:24', '2025-12-27 22:46:45', NULL, NULL),
(126, 'Beige', 72, '0072-2', 73, 262, 17, 13000.0000, 13000.0000, 75.0000, 22750.0000, 22750.0000, '2025-11-24 16:03:24', '2025-12-27 22:46:45', NULL, NULL),
(127, 'Marron', 72, '0072-3', 73, 263, 20, 13000.0000, 13000.0000, 75.0000, 22750.0000, 22750.0000, '2025-11-24 16:03:24', '2025-12-27 22:46:45', NULL, NULL),
(128, 'S', 73, '0073-1', 74, 264, 1, 17000.0000, 17000.0000, 75.0000, 29750.0000, 29750.0000, '2025-11-24 16:08:07', '2025-12-27 23:16:07', NULL, NULL),
(129, 'M', 73, '0073-2', 74, 265, 2, 17000.0000, 17000.0000, 75.0000, 29750.0000, 29750.0000, '2025-11-24 16:08:07', '2025-12-27 23:16:07', NULL, NULL),
(130, 'S', 74, '0074-1', 75, 266, 1, 20790.0000, 20790.0000, 75.0000, 36382.5000, 36382.5000, '2025-11-24 16:14:35', '2025-12-27 22:46:47', NULL, NULL),
(131, 'M', 74, '0074-2', 75, 267, 2, 20790.0000, 20790.0000, 75.0000, 36382.5000, 36382.5000, '2025-11-24 16:14:35', '2025-12-27 22:46:47', NULL, NULL),
(132, 'S', 75, '0075-1', 76, 268, 1, 14500.0000, 14500.0000, 75.0000, 25375.0000, 25375.0000, '2025-11-24 16:21:39', '2025-12-27 22:46:49', NULL, NULL),
(133, 'M', 75, '0075-2', 76, 269, 2, 14500.0000, 14500.0000, 75.0000, 25375.0000, 25375.0000, '2025-11-24 16:21:39', '2025-12-27 22:46:49', NULL, NULL),
(134, 'S', 76, '0076-1', 77, 270, 1, 9000.0000, 9000.0000, 75.0000, 15750.0000, 15750.0000, '2025-11-24 16:26:00', '2025-12-27 22:46:50', NULL, NULL),
(135, 'M', 77, '0077-1', 78, 271, 2, 12500.0000, 12500.0000, 75.0000, 21875.0000, 21875.0000, '2025-11-24 16:29:13', '2025-12-27 22:46:51', NULL, NULL),
(136, 'M', 78, '0078-1', 79, 272, 2, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 16:31:21', '2025-12-27 22:46:52', NULL, NULL),
(137, 'L', 79, '0079-1', 80, 273, 3, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 16:34:58', '2025-12-27 22:46:53', NULL, NULL),
(138, 'S', 80, '0080-1', 81, 274, 1, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 16:37:22', '2025-12-27 22:46:54', NULL, NULL),
(139, 'S', 81, '0081-1', 82, 275, 1, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 16:40:20', '2025-12-27 22:46:55', NULL, NULL),
(140, 'M', 82, '0082-1', 83, 276, 2, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 16:43:29', '2025-12-27 22:46:56', NULL, NULL),
(141, 'S', 83, '0083-1', 84, 277, 1, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 16:47:57', '2025-12-27 22:46:57', NULL, NULL),
(142, 'S', 84, '0084-1', 85, 278, 1, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 16:50:03', '2025-12-27 22:46:58', NULL, NULL),
(143, 'S', 85, '0085-1', 86, 279, 1, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 16:52:19', '2025-12-27 22:46:59', NULL, NULL),
(144, 'S', 86, '0086-1', 87, 280, 1, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 16:54:33', '2025-12-27 22:47:00', NULL, NULL),
(145, 'M', 87, '0087-1', 88, 281, 2, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 16:56:13', '2025-12-27 22:47:01', NULL, NULL),
(146, 'L', 88, '0088-1', 89, 282, 3, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 16:58:04', '2025-12-27 22:47:02', NULL, NULL),
(147, 'S', 89, '0089-1', 90, 283, 1, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 17:00:18', '2025-12-27 22:47:03', NULL, NULL),
(148, 'L', 90, '0090-1', 91, 284, 3, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 17:02:35', '2025-12-27 22:47:04', NULL, NULL),
(149, 'M', 91, '0091-1', 92, 285, 2, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 17:06:12', '2025-12-27 22:47:05', NULL, NULL),
(150, 'S', 92, '0092-1', 93, 286, 1, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 17:09:41', '2025-12-27 22:47:06', NULL, NULL),
(151, 'L', 93, '0093-1', 94, 287, 3, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 17:13:26', '2025-12-27 22:47:07', NULL, NULL),
(152, 'M', 94, '0094-1', 95, 288, 2, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 17:17:28', '2025-12-27 22:47:08', NULL, NULL),
(153, 'S', 95, '0095-1', 96, 289, 1, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 17:19:56', '2025-12-27 22:47:09', NULL, NULL),
(154, 'L', 95, '0095-2', 96, 290, 3, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 17:19:56', '2025-12-27 22:47:09', NULL, NULL),
(155, 'L', 96, '0096-1', 97, 291, 3, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 17:27:54', '2025-12-27 22:47:11', NULL, NULL),
(156, 'M', 97, '0097-1', 98, 293, 2, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 17:29:36', '2025-12-27 22:47:12', NULL, NULL),
(157, 'S', 98, '0098-1', 99, 294, 1, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 17:31:28', '2025-12-27 22:47:13', NULL, NULL),
(158, 'M', 98, '0098-2', 99, 295, 2, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 17:31:28', '2025-12-27 22:47:13', NULL, NULL),
(159, 'L', 98, '0098-3', 99, 296, 3, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 17:31:28', '2025-12-27 22:47:13', NULL, NULL),
(160, 'XL', 99, '0099-1', 100, 297, 4, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 17:33:25', '2025-12-27 22:47:14', NULL, NULL),
(161, 'S', 100, '0100-1', 101, 298, 1, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 17:47:19', '2025-12-27 22:47:15', NULL, NULL),
(162, 'M', 100, '0100-2', 101, 299, 2, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 17:47:19', '2025-12-27 22:47:15', NULL, NULL),
(163, 'M', 101, '0101-1', 102, 300, 2, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 17:50:10', '2025-12-27 22:47:16', NULL, NULL),
(164, 'M', 102, '0102-1', 103, 301, 2, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 17:52:14', '2025-12-27 22:47:17', NULL, NULL),
(165, 'S', 103, '0103-1', 104, 302, 1, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 17:54:11', '2025-12-27 22:47:19', NULL, NULL),
(166, 'S', 104, '0104-1', 105, 303, 1, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 17:56:12', '2025-12-27 22:47:20', NULL, NULL),
(167, 'M', 104, '0104-2', 105, 304, 2, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 17:56:12', '2025-12-27 22:47:20', NULL, NULL),
(168, 'M', 105, '0105-1', 106, 305, 2, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 17:58:50', '2025-12-27 22:47:21', NULL, NULL),
(169, 'S', 106, '0106-1', 107, 408, 1, 8600.0000, 8600.0000, 75.0000, 15050.0000, 15050.0000, '2025-11-24 18:01:10', '2025-12-27 22:47:42', NULL, NULL),
(170, 'M', 106, '0106-2', 107, 409, 2, 8600.0000, 8600.0000, 75.0000, 15050.0000, 15050.0000, '2025-11-24 18:01:10', '2025-12-27 22:47:42', NULL, NULL),
(171, 'L', 107, '0107-1', 108, 410, 3, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 18:04:04', '2025-12-27 22:47:43', NULL, NULL),
(172, 'XL', 107, '0107-2', 108, 411, 4, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 18:04:04', '2025-12-27 22:47:43', NULL, NULL),
(174, 'XL', 108, '0108-1', 110, 412, 4, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 18:07:29', '2025-12-27 22:47:44', NULL, NULL),
(175, 'S', 109, '0109-1', 111, 413, 1, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 18:10:02', '2025-12-27 22:47:46', NULL, NULL),
(176, 'M', 109, '0109-2', 111, 414, 2, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 18:10:02', '2025-12-27 22:47:46', NULL, NULL),
(177, 'L', 109, '0109-3', 111, 415, 3, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 18:10:02', '2025-12-27 22:47:46', NULL, NULL),
(178, 'M', 110, '0110-1', 112, 416, 2, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 18:16:13', '2025-12-27 22:47:47', NULL, NULL),
(179, 'S', 111, '0111-1', 113, 417, 1, 10150.0000, 10150.0000, 75.0000, 17762.5000, 17762.5000, '2025-11-24 18:17:59', '2025-12-27 22:47:48', NULL, NULL),
(180, 'XL', 112, '0112-1', 114, 418, 4, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 18:19:44', '2025-12-27 22:47:49', NULL, NULL),
(181, 'M', 113, '0113-1', 115, 419, 2, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 18:24:21', '2025-12-27 22:47:50', NULL, NULL),
(182, 'S', 114, '0114-1', 116, 420, 1, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 19:01:58', '2025-12-27 22:47:52', NULL, NULL),
(183, 'L', 114, '0114-2', 116, 421, 3, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 19:01:58', '2025-12-27 22:47:52', NULL, NULL),
(184, 'S', 115, '0115-1', 117, 422, 1, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 19:03:42', '2025-12-27 22:47:53', NULL, NULL),
(185, 'M', 116, '0116-1', 118, 423, 2, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-11-24 19:05:07', '2025-12-27 22:47:54', NULL, NULL),
(186, '38', 117, '0117-1', 119, 424, 24, 28000.0000, 28000.0000, 75.0000, 49000.0000, 49000.0000, '2025-11-24 19:17:04', '2025-12-27 22:47:55', NULL, NULL),
(187, '38', 118, '0118-1', 120, 425, 24, 26500.0000, 26500.0000, 75.0000, 46375.0000, 46375.0000, '2025-11-24 19:20:25', '2025-12-27 22:47:56', NULL, NULL),
(188, '40', 118, '0118-2', 120, 426, 25, 26500.0000, 26500.0000, 75.0000, 46375.0000, 46375.0000, '2025-11-24 19:20:25', '2025-12-27 22:47:56', NULL, NULL),
(189, '42', 118, '0118-3', 120, 427, 26, 26500.0000, 26500.0000, 75.0000, 46375.0000, 46375.0000, '2025-11-24 19:20:25', '2025-12-27 22:47:56', NULL, NULL),
(190, '38', 119, '0119-1', 121, 428, 24, 25500.0000, 25500.0000, 75.0000, 44625.0000, 44625.0000, '2025-11-24 19:23:30', '2025-12-27 22:47:57', NULL, NULL),
(191, '44', 120, '0120-1', 122, 429, 27, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-11-24 19:26:06', '2025-12-27 22:47:58', NULL, NULL),
(192, '42', 121, '0121-1', 123, 430, 26, 26500.0000, 26500.0000, 75.0000, 46375.0000, 46375.0000, '2025-11-24 19:28:46', '2025-12-27 22:47:59', NULL, NULL),
(193, '38', 122, '0122-1', 124, 431, 24, 26500.0000, 26500.0000, 75.0000, 46375.0000, 46375.0000, '2025-11-24 19:32:07', '2025-12-27 22:48:01', NULL, NULL),
(194, '40', 122, '0122-2', 124, 432, 25, 26500.0000, 26500.0000, 75.0000, 46375.0000, 46375.0000, '2025-11-24 19:32:07', '2025-12-27 22:48:01', NULL, NULL),
(195, '42', 122, '0122-3', 124, 433, 26, 26500.0000, 26500.0000, 75.0000, 46375.0000, 46375.0000, '2025-11-24 19:32:07', '2025-12-27 22:48:01', NULL, NULL),
(196, '42', 123, '0123-1', 125, 434, 26, 26500.0000, 26500.0000, 75.0000, 46375.0000, 46375.0000, '2025-11-24 20:00:33', '2025-12-27 22:48:02', NULL, NULL),
(197, '44', 123, '0123-2', 125, 435, 27, 26500.0000, 26500.0000, 75.0000, 46375.0000, 46375.0000, '2025-11-24 20:00:33', '2025-12-27 22:48:02', NULL, NULL),
(198, '38', 124, '0124-1', 126, 436, 24, 25000.0000, 25000.0000, 75.0000, 43750.0000, 43750.0000, '2025-11-24 20:03:45', '2025-12-27 22:48:03', NULL, NULL),
(199, '40', 124, '0124-2', 126, 437, 25, 25000.0000, 25000.0000, 75.0000, 43750.0000, 43750.0000, '2025-11-24 20:03:45', '2025-12-27 22:48:03', NULL, NULL),
(200, '42', 124, '0124-3', 126, 438, 26, 25000.0000, 25000.0000, 75.0000, 43750.0000, 43750.0000, '2025-11-24 20:03:45', '2025-12-27 22:48:03', NULL, NULL),
(201, '42', 125, '0125-1', 127, 439, 26, 26500.0000, 26500.0000, 75.0000, 46375.0000, 46375.0000, '2025-11-24 20:06:37', '2025-12-27 22:48:04', NULL, NULL),
(202, '38', 126, '0126-1', 128, 440, 24, 9900.0000, 9900.0000, 75.0000, 17325.0000, 17325.0000, '2025-11-24 20:09:20', '2025-12-27 22:48:05', NULL, NULL),
(203, '38', 127, '0127-1', 129, 441, 24, 9900.0000, 9900.0000, 75.0000, 17325.0000, 17325.0000, '2025-11-24 20:11:53', '2025-12-27 22:48:06', NULL, NULL),
(204, '38', 128, '0128-1', 130, 442, 24, 19000.0000, 19000.0000, 75.0000, 33250.0000, 33250.0000, '2025-11-24 20:15:02', '2025-12-27 22:48:08', NULL, NULL),
(205, '40', 128, '0128-2', 130, 443, 25, 19000.0000, 19000.0000, 75.0000, 33250.0000, 33250.0000, '2025-11-24 20:15:02', '2025-12-27 22:48:08', NULL, NULL),
(206, '42', 128, '0128-3', 130, 444, 26, 19000.0000, 19000.0000, 75.0000, 33250.0000, 33250.0000, '2025-11-24 20:15:02', '2025-12-27 22:48:08', NULL, NULL),
(207, '40', 129, '0129-1', 131, 445, 25, 20000.0000, 20000.0000, 75.0000, 35000.0000, 35000.0000, '2025-11-24 20:18:04', '2025-12-27 22:48:09', NULL, NULL),
(208, '42', 129, '0129-2', 131, 446, 26, 20000.0000, 20000.0000, 75.0000, 35000.0000, 35000.0000, '2025-11-24 20:18:04', '2025-12-27 22:48:09', NULL, NULL),
(209, '38', 130, '0130-1', 132, 447, 24, 19000.0000, 19000.0000, 75.0000, 33250.0000, 33250.0000, '2025-11-24 20:20:55', '2025-12-27 22:48:10', NULL, NULL),
(210, '36', 131, '0131-1', 133, 448, 23, 9900.0000, 9900.0000, 75.0000, 17325.0000, 17325.0000, '2025-11-24 20:23:36', '2025-12-27 22:48:11', NULL, NULL),
(211, '38', 131, '0131-2', 133, 449, 24, 9900.0000, 9900.0000, 75.0000, 17325.0000, 17325.0000, '2025-11-24 20:23:36', '2025-12-27 22:48:11', NULL, NULL),
(212, 'M', 132, '0132-1', 134, 450, 2, 35000.0000, 35000.0000, 75.0000, 61250.0000, 61250.0000, '2025-11-24 20:30:26', '2025-12-27 22:48:12', NULL, NULL),
(213, 'M', 133, '0133-1', 135, 451, 2, 44859.2000, 44859.2000, 75.0000, 78503.6000, 78503.6000, '2025-11-24 20:32:47', '2025-12-27 22:48:13', NULL, NULL),
(214, 'M', 134, '0134-1', 136, 452, 2, 45000.0000, 45000.0000, 75.0000, 78750.0000, 78750.0000, '2025-11-24 20:36:53', '2025-12-27 22:48:15', NULL, NULL),
(215, 'M', 135, '0135-1', 137, 453, 2, 30000.0000, 30000.0000, 75.0000, 52500.0000, 52500.0000, '2025-11-24 20:40:16', '2025-12-27 22:48:16', NULL, NULL),
(216, 'S', 136, '0136-1', 138, 454, 1, 8000.0000, 8000.0000, 75.0000, 14000.0000, 14000.0000, '2025-11-24 20:45:23', '2025-12-27 22:48:17', NULL, NULL),
(218, 'S', 138, '0138-1', 140, 455, 1, 8000.0000, 8000.0000, 75.0000, 14000.0000, 14000.0000, '2025-11-24 20:48:54', '2025-12-27 22:48:18', NULL, NULL),
(219, 'L', 139, '0139-1', 141, 456, 3, 8480.0000, 8480.0000, 75.0000, 14840.0000, 14840.0000, '2025-11-24 20:51:00', '2025-12-27 22:48:19', NULL, NULL),
(220, 'S', 140, '0140-1', 142, 457, 1, 5000.0000, 5000.0000, 75.0000, 8750.0000, 8750.0000, '2025-11-24 20:54:53', '2025-12-27 22:48:20', NULL, NULL),
(221, 'M', 140, '0140-2', 142, 458, 2, 5000.0000, 5000.0000, 75.0000, 8750.0000, 8750.0000, '2025-11-24 20:54:53', '2025-12-27 22:48:20', NULL, NULL),
(222, 'S', 141, '0141-1', 143, 459, 1, 5000.0000, 5000.0000, 75.0000, 8750.0000, 8750.0000, '2025-11-24 20:56:58', '2025-12-27 22:48:21', NULL, NULL),
(223, 'S', 142, '0142-1', 144, 460, 1, 8480.0000, 8480.0000, 75.0000, 14840.0000, 14840.0000, '2025-11-24 20:59:11', '2025-12-27 22:48:22', NULL, NULL),
(224, 'L', 143, '0143-1', 145, 461, 3, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-11-24 21:00:51', '2025-12-27 22:48:23', NULL, NULL),
(225, 'M', 144, '0144-1', 146, 462, 2, 10000.0000, 10000.0000, 75.0000, 17500.0000, 17500.0000, '2025-11-24 21:02:59', '2025-12-27 22:48:24', NULL, NULL),
(226, 'XL', 144, '0144-2', 146, 463, 4, 10000.0000, 10000.0000, 75.0000, 17500.0000, 17500.0000, '2025-11-24 21:02:59', '2025-12-27 22:48:24', NULL, NULL),
(227, 'M', 145, '0145-1', 147, 464, 2, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-11-24 21:04:47', '2025-12-27 22:48:25', NULL, NULL),
(228, 'XL', 146, '0146-1', 148, 465, 4, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-11-25 21:49:46', '2025-12-27 22:48:26', NULL, NULL),
(229, 'L', 147, '0147-1', 149, 466, 3, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-11-25 21:53:17', '2025-12-27 22:48:28', NULL, NULL),
(230, 'M', 148, '0148-1', 150, 467, 2, 12000.0000, 12000.0000, 75.0000, 21000.0000, 21000.0000, '2025-11-25 21:56:42', '2025-12-27 22:48:29', NULL, NULL),
(231, 'M', 149, '0149-1', 151, 468, 2, 12000.0000, 12000.0000, 75.0000, 21000.0000, 21000.0000, '2025-11-25 21:58:44', '2025-12-27 22:48:30', NULL, NULL),
(232, 'S', 150, '0150-1', 152, 469, 1, 15040.0000, 15040.0000, 75.0000, 26320.0000, 26320.0000, '2025-11-25 22:01:15', '2025-12-27 22:48:31', NULL, NULL),
(233, 'S', 151, '0151-1', 153, 470, 1, 12000.0000, 12000.0000, 75.0000, 21000.0000, 21000.0000, '2025-11-25 22:03:45', '2025-12-28 18:31:29', NULL, NULL),
(234, 'M', 152, '0152-1', 154, 471, 2, 15920.0000, 15920.0000, 75.0000, 27860.0000, 27860.0000, '2025-11-25 22:06:01', '2025-12-27 22:48:33', NULL, NULL),
(235, 'S', 153, '0153-1', 155, 472, 1, 10000.0000, 10000.0000, 75.0000, 17500.0000, 17500.0000, '2025-11-25 22:07:44', '2025-12-27 22:48:34', NULL, NULL),
(236, 'M', 154, '0154-1', 156, 473, 2, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-11-25 22:09:55', '2025-12-27 22:48:35', NULL, NULL),
(237, 'M', 155, '0155-1', 157, 474, 2, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-11-25 22:13:07', '2025-12-27 22:48:36', NULL, NULL),
(238, 'S', 156, '0156-1', 158, 475, 1, 14960.0000, 14960.0000, 75.0000, 26180.0000, 26180.0000, '2025-11-25 22:15:09', '2025-12-27 22:48:37', NULL, NULL),
(239, 'L', 157, '0157-1', 159, 476, 3, 8000.0000, 8000.0000, 75.0000, 14000.0000, 14000.0000, '2025-11-25 22:17:20', '2025-12-27 22:48:38', NULL, NULL),
(240, 'L', 158, '0158-1', 160, 477, 3, 8000.0000, 8000.0000, 75.0000, 14000.0000, 14000.0000, '2025-11-25 22:18:57', '2025-12-27 22:48:39', NULL, NULL),
(241, 'S', 159, '0159-1', 161, 478, 1, 12000.0000, 12000.0000, 75.0000, 21000.0000, 21000.0000, '2025-11-25 22:20:51', '2025-12-27 22:48:40', NULL, NULL),
(242, 'Marron claro', 160, '0160-1', 162, 479, 21, 12000.0000, 12000.0000, 75.0000, 21000.0000, 21000.0000, '2025-11-25 22:23:18', '2025-12-27 22:48:41', NULL, NULL),
(243, 'L', 161, '0161-1', 163, 480, 3, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-11-25 22:25:39', '2025-12-27 22:48:42', NULL, NULL),
(244, 'M', 162, '0162-1', 164, 481, 2, 30000.0000, 30000.0000, 75.0000, 52500.0000, 52500.0000, '2025-11-25 22:28:42', '2025-12-27 22:48:43', NULL, NULL),
(245, 'XL', 162, '0162-2', 164, 482, 4, 30000.0000, 30000.0000, 75.0000, 52500.0000, 52500.0000, '2025-11-25 22:28:42', '2025-12-27 22:48:43', NULL, NULL),
(246, 'M', 163, '0163-1', 165, 483, 2, 22000.0000, 22000.0000, 75.0000, 38500.0000, 38500.0000, '2025-11-25 22:34:11', '2025-12-27 22:48:44', NULL, NULL),
(247, 'XL', 164, '0164-1', 166, 484, 4, 22490.0000, 22490.0000, 75.0000, 39357.5000, 39357.5000, '2025-11-25 22:36:08', '2025-12-27 22:48:45', NULL, NULL),
(248, 'S', 165, '0165-1', 167, 485, 1, 19990.0000, 19990.0000, 75.0000, 34982.5000, 34982.5000, '2025-11-25 22:40:31', '2025-12-27 22:48:46', NULL, NULL),
(249, 'M', 165, '0165-2', 167, 486, 2, 19990.0000, 19990.0000, 75.0000, 34982.5000, 34982.5000, '2025-11-25 22:40:31', '2025-12-27 22:48:46', NULL, NULL),
(250, 'M', 166, '0166-1', 168, 487, 2, 18750.0000, 18750.0000, 75.0000, 32812.5000, 32812.5000, '2025-11-25 22:46:44', '2025-12-27 22:48:48', NULL, NULL),
(251, 'L', 166, '0166-2', 168, 488, 3, 18750.0000, 18750.0000, 75.0000, 32812.5000, 32812.5000, '2025-11-25 22:46:44', '2025-12-27 22:48:48', NULL, NULL),
(252, 'M', 167, '0167-1', 169, 489, 2, 22500.0000, 22500.0000, 75.0000, 39375.0000, 39375.0000, '2025-11-25 22:48:55', '2025-12-27 22:48:49', NULL, NULL),
(253, 'M', 168, '0168-1', 170, 490, 2, 31250.0000, 31250.0000, 75.0000, 54687.5000, 54687.5000, '2025-11-25 23:02:13', '2025-12-27 22:48:50', NULL, NULL),
(254, 'S', 169, '0169-1', 171, 491, 1, 18750.0000, 18750.0000, 75.0000, 32812.5000, 32812.5000, '2025-11-26 20:09:54', '2025-12-27 22:48:52', NULL, NULL),
(255, 'M', 169, '0169-2', 171, 492, 2, 18750.0000, 18750.0000, 75.0000, 32812.5000, 32812.5000, '2025-11-26 20:09:54', '2025-12-27 22:48:52', NULL, NULL),
(256, 'L', 169, '0169-3', 171, 493, 3, 18750.0000, 18750.0000, 75.0000, 32812.5000, 32812.5000, '2025-11-26 20:09:54', '2025-12-27 22:48:52', NULL, NULL),
(257, 'M', 170, '0170-1', 172, 494, 2, 22500.0000, 22500.0000, 75.0000, 39375.0000, 39375.0000, '2025-11-26 20:14:00', '2025-12-27 22:48:53', NULL, NULL),
(258, 'XL', 170, '0170-2', 172, 495, 4, 22500.0000, 22500.0000, 75.0000, 39375.0000, 39375.0000, '2025-11-26 20:14:00', '2025-12-27 22:48:53', NULL, NULL),
(259, 'M', 171, '0171-1', 173, 496, 2, 37490.0000, 37490.0000, 75.0000, 65607.5000, 65607.5000, '2025-11-26 20:18:16', '2025-12-27 22:48:54', NULL, NULL),
(260, 'M', 172, '0172-1', 174, 497, 2, 18785.0000, 18785.0000, 75.0000, 32873.7500, 32873.7500, '2025-11-26 20:20:15', '2025-12-27 22:48:55', NULL, NULL),
(261, 'S', 173, '0173-1', 175, 498, 1, 27551.0000, 27551.0000, 75.0000, 48214.2500, 48214.2500, '2025-11-26 20:22:22', '2025-12-27 22:48:56', NULL, NULL),
(262, 'S', 174, '0174-1', 176, 499, 1, 27551.0000, 27551.0000, 75.0000, 48214.2500, 48214.2500, '2025-11-26 20:30:15', '2025-12-27 22:48:57', NULL, NULL),
(263, 'M', 175, '0175-1', 177, 500, 2, 19900.0000, 19900.0000, 75.0000, 34825.0000, 34825.0000, '2025-11-26 20:39:12', '2025-12-27 22:48:58', NULL, NULL),
(264, 'S', 176, '0176-1', 178, 501, 1, 32900.0000, 32900.0000, 75.0000, 57575.0000, 57575.0000, '2025-11-26 20:41:20', '2025-12-27 22:48:59', NULL, NULL),
(265, 'M', 177, '0177-1', 179, 502, 2, 29900.0000, 29900.0000, 75.0000, 52325.0000, 52325.0000, '2025-11-26 20:45:05', '2025-12-27 22:49:00', NULL, NULL),
(266, 'S', 178, '0178-1', 180, 504, 1, 26900.0000, 26900.0000, 75.0000, 47075.0000, 47075.0000, '2025-11-26 20:47:15', '2025-12-27 22:49:01', NULL, NULL),
(267, 'S', 179, '0179-1', 181, 505, 1, 5000.0000, 5000.0000, 75.0000, 8750.0000, 8750.0000, '2025-11-26 20:49:40', '2025-12-27 22:49:02', NULL, NULL),
(268, 'M', 179, '0179-2', 181, 506, 2, 5000.0000, 5000.0000, 75.0000, 8750.0000, 8750.0000, '2025-11-26 20:49:40', '2025-12-27 22:49:02', NULL, NULL),
(269, 'M', 180, '0180-1', 182, 507, 2, 17900.0000, 17900.0000, 75.0000, 31325.0000, 31325.0000, '2025-11-26 20:51:53', '2025-12-27 22:49:03', NULL, NULL),
(270, 'M', 181, '0181-1', 183, 508, 2, 18900.0000, 18900.0000, 75.0000, 33075.0000, 33075.0000, '2025-11-26 20:55:13', '2025-12-27 22:49:04', NULL, NULL),
(271, 'M', 182, '0182-1', 184, 509, 2, 22900.0000, 22900.0000, 75.0000, 40075.0000, 40075.0000, '2025-11-26 21:10:57', '2025-12-27 22:49:05', NULL, NULL),
(272, 'M', 183, '0183-1', 185, 510, 2, 24900.0000, 24900.0000, 75.0000, 43575.0000, 43575.0000, '2025-11-26 21:17:58', '2025-12-27 22:49:06', NULL, NULL),
(273, 'Negro', 184, '0184-1', 186, 512, 7, 9900.0000, 9900.0000, 75.0000, 17325.0000, 17325.0000, '2025-11-26 21:20:18', '2025-12-27 22:49:07', NULL, NULL),
(274, 'Negro', 185, '0185-1', 187, 513, 7, 17900.0000, 17900.0000, 75.0000, 31325.0000, 31325.0000, '2025-11-26 21:22:25', '2025-12-27 22:49:08', NULL, NULL),
(275, 'Negro', 186, '0186-1', 188, 514, 7, 14900.0000, 14900.0000, 75.0000, 26075.0000, 26075.0000, '2025-11-26 21:24:17', '2025-12-27 22:49:09', NULL, NULL),
(277, 'Gris', 188, '0188-1', 190, 515, 10, 15900.0000, 15900.0000, 75.0000, 27825.0000, 27825.0000, '2025-11-26 21:29:35', '2025-12-27 22:49:10', NULL, NULL),
(278, 'S', 189, '0189-1', 191, 516, 1, 26900.0000, 26900.0000, 75.0000, 47075.0000, 47075.0000, '2025-11-26 21:31:56', '2025-12-27 22:49:11', NULL, NULL),
(279, 'Negro', 190, '0190-1', 192, 517, 7, 11900.0000, 11900.0000, 75.0000, 20825.0000, 20825.0000, '2025-11-26 21:34:26', '2025-12-27 22:49:12', NULL, NULL),
(280, 'S', 183, '0183-2', 193, 511, 1, 24900.0000, 24900.0000, 75.0000, 43575.0000, 43575.0000, '2025-11-26 21:46:43', '2025-12-27 22:49:06', NULL, NULL),
(281, 'DUMMY', 191, '0191', 194, NULL, NULL, 24900.0000, 24900.0000, 75.0000, 43575.0000, 43575.0000, '2025-11-26 21:55:20', '2025-12-27 22:32:30', NULL, '[]'),
(282, 'Negro', 192, '0192-1', 195, 519, 7, 12900.0000, 12900.0000, 75.0000, 22575.0000, 22575.0000, '2025-11-30 15:41:26', '2025-12-27 22:49:14', NULL, NULL),
(283, 'S', 193, '0193-1', 196, 520, 1, 19900.0000, 19900.0000, 75.0000, 34825.0000, 34825.0000, '2025-11-30 15:43:41', '2025-12-27 22:49:15', NULL, NULL),
(284, 'Negro', 194, '0194-1', 197, 521, 7, 17900.0000, 17900.0000, 75.0000, 31325.0000, 31325.0000, '2025-11-30 15:52:23', '2025-12-27 22:49:16', NULL, NULL),
(285, 'M', 195, '0195-1', 198, 522, 2, 15900.0000, 15900.0000, 75.0000, 27825.0000, 27825.0000, '2025-11-30 15:55:10', '2025-12-28 18:33:50', NULL, NULL),
(286, 'S', 196, '0196-1', 199, 523, 1, 22900.0000, 22900.0000, 75.0000, 40075.0000, 40075.0000, '2025-11-30 15:57:52', '2025-12-27 22:49:18', NULL, NULL),
(287, 'S', 177, '0177-2', 200, 503, 1, 29900.0000, 29900.0000, 75.0000, 52325.0000, 52325.0000, '2025-11-30 15:58:50', '2025-12-27 22:49:00', NULL, NULL),
(288, 'M', 197, '0197-1', 201, 524, 2, 17900.0000, 17900.0000, 75.0000, 31325.0000, 31325.0000, '2025-11-30 16:01:21', '2025-12-27 22:49:19', NULL, NULL),
(289, 'Beige', 198, '0198-1', 202, 525, 17, 16900.0000, 16900.0000, 75.0000, 29575.0000, 29575.0000, '2025-11-30 16:03:40', '2025-12-27 22:49:20', NULL, NULL),
(290, '38', 199, '0199-1', 203, 526, 24, 17000.0000, 17000.0000, 75.0000, 29750.0000, 29750.0000, '2025-11-30 16:07:34', '2025-12-27 22:49:21', NULL, NULL),
(291, '36', 200, '0200-1', 204, 527, 23, 10000.0000, 10000.0000, 75.0000, 17500.0000, 17500.0000, '2025-11-30 16:14:06', '2025-12-27 22:49:22', NULL, NULL),
(292, '38', 200, '0200-2', 204, 528, 24, 10000.0000, 10000.0000, 75.0000, 17500.0000, 17500.0000, '2025-11-30 16:14:06', '2025-12-27 22:49:22', NULL, NULL),
(293, '36', 201, '0201-1', 205, 529, 23, 16000.0000, 16000.0000, 75.0000, 28000.0000, 28000.0000, '2025-11-30 16:18:08', '2025-12-27 22:49:24', NULL, NULL),
(294, '38', 201, '0201-2', 205, 530, 24, 16000.0000, 16000.0000, 75.0000, 28000.0000, 28000.0000, '2025-11-30 16:18:08', '2025-12-27 22:49:24', NULL, NULL),
(295, '40', 201, '0201-3', 205, 531, 25, 16000.0000, 16000.0000, 75.0000, 28000.0000, 28000.0000, '2025-11-30 16:18:08', '2025-12-27 22:49:24', NULL, NULL),
(296, '42', 201, '0201-4', 205, 532, 26, 16000.0000, 16000.0000, 75.0000, 28000.0000, 28000.0000, '2025-11-30 16:18:08', '2025-12-27 22:49:24', NULL, NULL),
(297, '38', 202, '0202-1', 206, 533, 24, 16000.0000, 16000.0000, 75.0000, 28000.0000, 28000.0000, '2025-11-30 16:22:04', '2025-12-27 22:49:25', NULL, NULL),
(298, '42', 202, '0202-2', 206, 534, 26, 16000.0000, 16000.0000, 75.0000, 28000.0000, 28000.0000, '2025-11-30 16:22:04', '2025-12-27 22:49:25', NULL, NULL),
(302, '36', 204, '0204-1', 208, 535, 23, 17000.0000, 17000.0000, 75.0000, 29750.0000, 29750.0000, '2025-11-30 16:29:26', '2025-12-27 22:49:26', NULL, NULL),
(303, '38', 204, '0204-2', 208, 536, 24, 17000.0000, 17000.0000, 75.0000, 29750.0000, 29750.0000, '2025-11-30 16:29:26', '2025-12-27 22:49:26', NULL, NULL),
(304, '38', 205, '0205-1', 209, 537, 24, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-11-30 16:36:17', '2025-12-27 22:49:28', NULL, NULL),
(305, '40', 205, '0205-2', 209, 538, 25, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-11-30 16:36:17', '2025-12-27 22:49:28', NULL, NULL),
(306, '42', 205, '0205-3', 209, 539, 26, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-11-30 16:36:17', '2025-12-27 22:49:28', NULL, NULL),
(307, '36', 205, '0205-4', 210, 540, 23, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-11-30 16:37:40', '2025-12-27 22:49:28', NULL, NULL),
(308, '36', 206, '0206-1', 211, 541, 23, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-11-30 16:44:08', '2025-12-27 22:49:29', NULL, NULL),
(309, '38', 206, '0206-2', 211, 542, 24, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-11-30 16:44:08', '2025-12-27 22:49:29', NULL, NULL),
(310, '40', 206, '0206-3', 211, 543, 25, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-11-30 16:44:08', '2025-12-27 22:49:29', NULL, NULL),
(311, '36', 207, '0207-1', 212, 544, 23, 17000.0000, 17000.0000, 75.0000, 29750.0000, 29750.0000, '2025-11-30 16:46:41', '2025-12-27 22:49:30', NULL, NULL),
(312, '38', 207, '0207-2', 212, 545, 24, 17000.0000, 17000.0000, 75.0000, 29750.0000, 29750.0000, '2025-11-30 16:46:41', '2025-12-27 22:49:30', NULL, NULL),
(313, '40', 207, '0207-3', 212, 546, 25, 17000.0000, 17000.0000, 75.0000, 29750.0000, 29750.0000, '2025-11-30 16:46:41', '2025-12-27 22:49:30', NULL, NULL),
(314, '38', 208, '0208-1', 213, 547, 24, 19000.0000, 19000.0000, 75.0000, 33250.0000, 33250.0000, '2025-11-30 16:51:02', '2025-12-27 22:49:32', NULL, NULL),
(315, '40', 208, '0208-2', 213, 548, 25, 19000.0000, 19000.0000, 75.0000, 33250.0000, 33250.0000, '2025-11-30 16:51:02', '2025-12-27 22:49:32', NULL, NULL),
(316, '42', 208, '0208-3', 213, 549, 26, 19000.0000, 19000.0000, 75.0000, 33250.0000, 33250.0000, '2025-11-30 16:51:02', '2025-12-27 22:49:32', NULL, NULL),
(317, '38', 209, '0209-1', 214, 688, 24, 17000.0000, 17000.0000, 75.0000, 29750.0000, 29750.0000, '2025-11-30 16:56:44', '2025-12-27 22:52:11', NULL, NULL),
(318, '40', 209, '0209-2', 214, 689, 25, 17000.0000, 17000.0000, 75.0000, 29750.0000, 29750.0000, '2025-11-30 16:56:44', '2025-12-27 22:52:11', NULL, NULL),
(319, '42', 209, '0209-3', 214, 690, 26, 17000.0000, 17000.0000, 75.0000, 29750.0000, 29750.0000, '2025-11-30 16:56:44', '2025-12-27 22:52:11', NULL, NULL),
(320, 'M', 210, '0210-1', 215, 691, 2, 17000.0000, 17000.0000, 75.0000, 29750.0000, 29750.0000, '2025-11-30 17:02:27', '2025-12-27 22:52:12', NULL, NULL),
(321, 'M', 211, '0211-1', 216, 692, 2, 14000.0000, 14000.0000, 75.0000, 24500.0000, 24500.0000, '2025-11-30 17:08:56', '2025-12-27 22:52:13', NULL, NULL),
(322, 'Marron', 212, '0212-1', 217, 693, 20, 9800.0000, 9800.0000, 75.0000, 17150.0000, 17150.0000, '2025-11-30 17:13:24', '2025-12-27 22:52:14', NULL, NULL),
(323, 'Unico', 213, '0213-1', 218, 694, 30, 7500.0000, 7500.0000, 75.0000, 13125.0000, 13125.0000, '2025-11-30 17:16:43', '2025-12-27 22:52:15', NULL, NULL),
(324, 'Negro', 214, '0214-1', 219, 695, 7, 11800.0000, 11800.0000, 75.0000, 20650.0000, 20650.0000, '2025-11-30 17:19:38', '2025-12-27 22:52:16', NULL, NULL),
(325, 'S', 215, '0215-1', 220, 696, 1, 9000.0000, 9000.0000, 75.0000, 15750.0000, 15750.0000, '2025-11-30 17:21:30', '2025-12-27 22:52:17', NULL, NULL),
(326, 'M', 216, '0216-1', 221, 697, 2, 22500.0000, 22500.0000, 75.0000, 39375.0000, 39375.0000, '2025-11-30 17:23:56', '2025-12-27 22:52:18', NULL, NULL),
(327, 'M', 217, '0217-1', 222, 698, 2, 11000.0000, 11000.0000, 75.0000, 19250.0000, 19250.0000, '2025-11-30 17:27:04', '2025-12-27 22:52:19', NULL, NULL),
(328, 'M', 218, '0218-1', 223, 699, 2, 22500.0000, 22500.0000, 75.0000, 39375.0000, 39375.0000, '2025-11-30 17:31:09', '2025-12-27 22:52:20', NULL, NULL),
(329, 'M', 219, '0219-1', 224, 700, 2, 8800.0000, 8800.0000, 75.0000, 15400.0000, 15400.0000, '2025-11-30 17:35:22', '2025-12-27 22:52:21', NULL, NULL),
(330, 'M', 220, '0220-1', 225, 701, 2, 9500.0000, 9500.0000, 75.0000, 16625.0000, 16625.0000, '2025-11-30 17:37:32', '2025-12-27 22:52:22', NULL, NULL),
(331, 'M', 221, '0221-1', 226, 702, 2, 7200.0000, 7200.0000, 75.0000, 12600.0000, 12600.0000, '2025-11-30 17:39:38', '2025-12-27 22:52:23', NULL, NULL),
(332, 'M', 222, '0222-1', 227, 703, 2, 20500.0000, 20500.0000, 75.0000, 35875.0000, 35875.0000, '2025-11-30 17:44:54', '2025-12-27 22:52:24', NULL, NULL),
(333, 'M', 223, '0223-1', 228, 704, 2, 14500.0000, 14500.0000, 75.0000, 25375.0000, 25375.0000, '2025-11-30 17:48:42', '2025-12-27 22:52:25', NULL, NULL),
(334, 'M', 224, '0224-1', 229, 705, 2, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-11-30 17:51:13', '2025-12-27 22:52:26', NULL, NULL),
(335, 'M', 225, '0225-1', 230, 706, 2, 18800.0000, 18800.0000, 75.0000, 32900.0000, 32900.0000, '2025-11-30 17:56:49', '2025-12-27 22:52:27', NULL, NULL),
(336, 'M', 226, '0226-1', 231, 707, 2, 28000.0000, 28000.0000, 75.0000, 49000.0000, 49000.0000, '2025-11-30 18:01:26', '2025-12-27 22:52:28', NULL, NULL),
(337, 'M', 227, '0227-1', 232, 708, 2, 19200.0000, 19200.0000, 75.0000, 33600.0000, 33600.0000, '2025-11-30 18:03:52', '2025-12-27 22:52:29', NULL, NULL),
(338, 'M', 228, '0228-1', 233, 709, 2, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-11-30 18:06:01', '2025-12-27 22:52:30', NULL, NULL),
(339, 'M', 229, '0229-1', 234, 710, 2, 16000.0000, 16000.0000, 75.0000, 28000.0000, 28000.0000, '2025-11-30 18:08:04', '2025-12-27 22:52:32', NULL, NULL),
(343, 'Gris', 231, '0231-1', 236, 711, 10, 16800.0000, 16800.0000, 75.0000, 29400.0000, 29400.0000, '2025-11-30 18:32:04', '2025-12-27 22:52:33', NULL, NULL),
(344, 'Beige', 231, '0231-2', 236, 712, 17, 16800.0000, 16800.0000, 75.0000, 29400.0000, 29400.0000, '2025-11-30 18:32:04', '2025-12-27 22:52:33', NULL, NULL),
(345, 'Natural', 231, '0231-3', 236, 713, 22, 16800.0000, 16800.0000, 75.0000, 29400.0000, 29400.0000, '2025-11-30 18:32:04', '2025-12-27 22:52:33', NULL, NULL),
(346, 'Rojo', 232, '0232-1', 237, 714, 6, 18800.0000, 18800.0000, 75.0000, 32900.0000, 32900.0000, '2025-11-30 18:35:12', '2025-12-27 22:52:34', NULL, NULL),
(347, 'Verde', 232, '0232-2', 237, 715, 12, 18800.0000, 18800.0000, 75.0000, 32900.0000, 32900.0000, '2025-11-30 18:35:12', '2025-12-27 22:52:34', NULL, NULL),
(348, 'Marron claro', 232, '0232-3', 237, 716, 21, 18800.0000, 18800.0000, 75.0000, 32900.0000, 32900.0000, '2025-11-30 18:35:12', '2025-12-27 22:52:34', NULL, NULL),
(349, 'Amarillo', 233, '0233-1', 238, 717, 11, 15500.0000, 15500.0000, 75.0000, 27125.0000, 27125.0000, '2025-11-30 18:36:50', '2025-12-27 22:52:36', NULL, NULL);
INSERT INTO `variations` (`id`, `name`, `product_id`, `sub_sku`, `product_variation_id`, `woocommerce_variation_id`, `variation_value_id`, `default_purchase_price`, `dpp_inc_tax`, `profit_percent`, `default_sell_price`, `sell_price_inc_tax`, `created_at`, `updated_at`, `deleted_at`, `combo_variations`) VALUES
(350, 'Verde', 233, '0233-2', 238, 718, 12, 15500.0000, 15500.0000, 75.0000, 27125.0000, 27125.0000, '2025-11-30 18:36:50', '2025-12-27 22:52:36', NULL, NULL),
(351, 'Naranja', 233, '0233-3', 238, 719, 31, 15500.0000, 15500.0000, 75.0000, 27125.0000, 27125.0000, '2025-11-30 18:36:50', '2025-12-27 22:52:36', NULL, NULL),
(352, 'Gris', 234, '0234-1', 239, 721, 10, 20500.0000, 20500.0000, 75.0000, 35875.0000, 35875.0000, '2025-11-30 18:39:31', '2025-12-27 22:52:39', NULL, NULL),
(353, 'Beige', 234, '0234-2', 239, 722, 17, 20500.0000, 20500.0000, 75.0000, 35875.0000, 35875.0000, '2025-11-30 18:39:31', '2025-12-27 22:52:39', NULL, NULL),
(354, 'Natural', 234, '0234-3', 239, 723, 22, 20500.0000, 20500.0000, 75.0000, 35875.0000, 35875.0000, '2025-11-30 18:39:31', '2025-12-27 22:52:39', NULL, NULL),
(355, 'Verde', 235, '0235-1', 240, 724, 12, 15400.0000, 15400.0000, 75.0000, 26950.0000, 26950.0000, '2025-11-30 18:44:23', '2025-12-27 22:52:40', NULL, NULL),
(356, 'Marron', 235, '0235-2', 240, 725, 20, 15400.0000, 15400.0000, 75.0000, 26950.0000, 26950.0000, '2025-11-30 18:44:23', '2025-12-27 22:52:40', NULL, NULL),
(357, 'Rojo', 236, '0236-1', 241, 726, 6, 16800.0000, 16800.0000, 75.0000, 29400.0000, 29400.0000, '2025-11-30 18:51:16', '2025-12-27 22:52:41', NULL, NULL),
(358, 'M', 237, '0237-1', 242, 727, 2, 25000.0000, 25000.0000, 75.0000, 43750.0000, 43750.0000, '2025-11-30 19:03:02', '2025-12-27 22:52:42', NULL, NULL),
(359, 'S', 238, '0238-1', 243, 728, 1, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-11-30 19:09:54', '2025-12-27 22:52:44', NULL, NULL),
(360, 'M', 238, '0238-2', 243, 729, 2, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-11-30 19:09:54', '2025-12-27 22:52:44', NULL, NULL),
(361, 'L', 238, '0238-3', 243, 730, 3, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-11-30 19:09:54', '2025-12-27 22:52:44', NULL, NULL),
(362, 'XL', 238, '0238-4', 243, 731, 4, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-11-30 19:09:54', '2025-12-27 22:52:44', NULL, NULL),
(363, 'S', 239, '0239-1', 244, 732, 1, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-11-30 21:48:43', '2025-12-30 01:43:46', NULL, NULL),
(364, 'M', 239, '0239-2', 244, 733, 2, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-11-30 21:48:43', '2025-12-30 01:43:46', NULL, NULL),
(365, 'L', 239, '0239-3', 244, 734, 3, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-11-30 21:48:43', '2025-12-30 01:43:46', NULL, NULL),
(366, 'XL', 239, '0239-4', 244, 735, 4, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-11-30 21:48:43', '2025-12-30 01:43:46', NULL, NULL),
(367, 'M', 240, '0240-1', 245, 736, 2, 28000.0000, 28000.0000, 75.0000, 49000.0000, 49000.0000, '2025-11-30 21:54:50', '2025-12-27 22:52:46', NULL, NULL),
(368, 'L', 240, '0240-2', 245, 737, 3, 28000.0000, 28000.0000, 75.0000, 49000.0000, 49000.0000, '2025-11-30 21:54:50', '2025-12-27 22:52:46', NULL, NULL),
(369, 'S', 241, '0241-1', 246, 738, 1, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-11-30 22:01:45', '2025-12-27 22:52:49', NULL, NULL),
(370, 'M', 241, '0241-2', 246, 739, 2, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-11-30 22:01:45', '2025-12-27 22:52:49', NULL, NULL),
(371, 'L', 241, '0241-3', 246, 740, 3, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-11-30 22:01:45', '2025-12-27 22:52:49', NULL, NULL),
(372, 'XL', 241, '0241-4', 246, 741, 4, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-11-30 22:01:45', '2025-12-27 22:52:49', NULL, NULL),
(373, 'M', 242, '0242-1', 247, 743, 2, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-11-30 22:04:49', '2025-12-27 22:52:50', NULL, NULL),
(374, 'L', 242, '0242-2', 247, 744, 3, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-11-30 22:04:49', '2025-12-27 22:52:50', NULL, NULL),
(375, 'M', 243, '0243-1', 248, 745, 2, 20000.0000, 20000.0000, 75.0000, 35000.0000, 35000.0000, '2025-11-30 22:08:43', '2025-12-27 22:52:51', NULL, NULL),
(376, 'L', 243, '0243-2', 248, 746, 3, 20000.0000, 20000.0000, 75.0000, 35000.0000, 35000.0000, '2025-11-30 22:08:43', '2025-12-27 22:52:51', NULL, NULL),
(377, 'S', 244, '0244-1', 249, 747, 1, 20000.0000, 20000.0000, 75.0000, 35000.0000, 35000.0000, '2025-11-30 22:12:05', '2025-12-27 22:52:52', NULL, NULL),
(378, 'L', 244, '0244-2', 249, 748, 3, 20000.0000, 20000.0000, 75.0000, 35000.0000, 35000.0000, '2025-11-30 22:12:05', '2025-12-27 22:52:52', NULL, NULL),
(379, 'S', 245, '0245-1', 250, 749, 1, 20000.0000, 20000.0000, 75.0000, 35000.0000, 35000.0000, '2025-11-30 22:14:19', '2025-12-27 22:52:53', NULL, NULL),
(380, 'L', 245, '0245-2', 250, 750, 3, 20000.0000, 20000.0000, 75.0000, 35000.0000, 35000.0000, '2025-11-30 22:14:19', '2025-12-27 22:52:53', NULL, NULL),
(381, 'S', 246, '0246-1', 251, 751, 1, 20000.0000, 20000.0000, 75.0000, 35000.0000, 35000.0000, '2025-11-30 22:17:06', '2025-12-27 22:52:54', NULL, NULL),
(382, 'M', 246, '0246-2', 251, 752, 2, 20000.0000, 20000.0000, 75.0000, 35000.0000, 35000.0000, '2025-11-30 22:17:06', '2025-12-27 22:52:54', NULL, NULL),
(383, 'L', 246, '0246-3', 251, 753, 3, 20000.0000, 20000.0000, 75.0000, 35000.0000, 35000.0000, '2025-11-30 22:17:06', '2025-12-27 22:52:54', NULL, NULL),
(384, 'M', 247, '0247-1', 252, 754, 2, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:18:46', '2025-12-27 22:52:55', NULL, NULL),
(385, 'S', 248, '0248-1', 253, 755, 1, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:20:40', '2025-12-27 22:52:57', NULL, NULL),
(386, 'M', 248, '0248-2', 253, 756, 2, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:20:40', '2025-12-27 22:52:57', NULL, NULL),
(387, 'L', 248, '0248-3', 253, 757, 3, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:20:40', '2025-12-27 22:52:57', NULL, NULL),
(388, 'S', 249, '0249-1', 254, 758, 1, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:22:56', '2025-12-27 22:52:58', NULL, NULL),
(389, 'M', 249, '0249-2', 254, 759, 2, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:22:56', '2025-12-27 22:52:58', NULL, NULL),
(390, 'L', 249, '0249-3', 254, 760, 3, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:22:56', '2025-12-27 22:52:58', NULL, NULL),
(391, 'S', 250, '0250-1', 255, 761, 1, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-12-01 22:25:44', '2025-12-27 22:52:59', NULL, NULL),
(392, 'M', 250, '0250-2', 255, 762, 2, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-12-01 22:25:44', '2025-12-27 22:52:59', NULL, NULL),
(393, 'L', 250, '0250-3', 255, 763, 3, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-12-01 22:25:44', '2025-12-27 22:52:59', NULL, NULL),
(394, 'M', 251, '0251-1', 256, 765, 2, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:28:10', '2025-12-27 22:53:00', NULL, NULL),
(395, 'L', 251, '0251-2', 256, 766, 3, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:28:10', '2025-12-27 22:53:00', NULL, NULL),
(396, 'S', 252, '0252-1', 257, 767, 1, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:30:13', '2025-12-27 22:53:02', NULL, NULL),
(397, 'M', 252, '0252-2', 257, 768, 2, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:30:13', '2025-12-27 22:53:02', NULL, NULL),
(398, 'L', 252, '0252-3', 257, 769, 3, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:30:13', '2025-12-27 22:53:02', NULL, NULL),
(399, 'S', 253, '0253-1', 258, 770, 1, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:32:21', '2025-12-27 22:53:03', NULL, NULL),
(400, 'M', 253, '0253-2', 258, 771, 2, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:32:21', '2025-12-27 22:53:03', NULL, NULL),
(401, 'L', 254, '0254-1', 259, 772, 3, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:34:26', '2025-12-27 22:53:04', NULL, NULL),
(402, 'XL', 254, '0254-2', 259, 773, 4, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:34:26', '2025-12-27 22:53:04', NULL, NULL),
(403, 'M', 255, '0255-1', 260, 774, 2, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:36:23', '2025-12-27 22:53:05', NULL, NULL),
(404, 'XL', 255, '0255-2', 260, 775, 4, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:36:23', '2025-12-27 22:53:05', NULL, NULL),
(405, 'M', 256, '0256-1', 261, 776, 2, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:38:20', '2025-12-27 22:53:07', NULL, NULL),
(406, 'XL', 256, '0256-2', 261, 777, 4, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:38:20', '2025-12-27 22:53:07', NULL, NULL),
(407, 'M', 257, '0257-1', 262, 778, 2, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:40:10', '2025-12-27 22:53:08', NULL, NULL),
(408, 'L', 257, '0257-2', 262, 779, 3, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:40:10', '2025-12-27 22:53:08', NULL, NULL),
(409, 'XL', 257, '0257-3', 262, 780, 4, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:40:10', '2025-12-27 22:53:08', NULL, NULL),
(410, 'M', 258, '0258-1', 263, 781, 2, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:41:57', '2025-12-27 22:53:09', NULL, NULL),
(411, 'L', 258, '0258-2', 263, 782, 3, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-01 22:41:57', '2025-12-27 22:53:09', NULL, NULL),
(412, 'M', 259, '0259-1', 264, 783, 2, 8000.0000, 8000.0000, 75.0000, 14000.0000, 14000.0000, '2025-12-02 22:35:06', '2025-12-27 22:53:10', NULL, NULL),
(413, 'L', 259, '0259-2', 264, 784, 3, 8000.0000, 8000.0000, 75.0000, 14000.0000, 14000.0000, '2025-12-02 22:35:06', '2025-12-27 22:53:10', NULL, NULL),
(414, 'S', 260, '0260-1', 265, 785, 1, 6900.0000, 6900.0000, 75.0000, 12075.0000, 12075.0000, '2025-12-02 22:37:09', '2025-12-27 22:53:12', NULL, NULL),
(415, 'M', 260, '0260-2', 265, 786, 2, 6900.0000, 6900.0000, 75.0000, 12075.0000, 12075.0000, '2025-12-02 22:37:09', '2025-12-27 22:53:12', NULL, NULL),
(416, 'L', 260, '0260-3', 265, 787, 3, 6900.0000, 6900.0000, 75.0000, 12075.0000, 12075.0000, '2025-12-02 22:37:09', '2025-12-27 22:53:12', NULL, NULL),
(417, 'S', 261, '0261-1', 266, 788, 1, 7500.0000, 7500.0000, 75.0000, 13125.0000, 13125.0000, '2025-12-02 22:39:49', '2025-12-27 22:53:13', NULL, NULL),
(418, 'M', 261, '0261-2', 266, 789, 2, 7500.0000, 7500.0000, 75.0000, 13125.0000, 13125.0000, '2025-12-02 22:39:49', '2025-12-27 22:53:13', NULL, NULL),
(419, 'L', 261, '0261-3', 266, 790, 3, 7500.0000, 7500.0000, 75.0000, 13125.0000, 13125.0000, '2025-12-02 22:39:49', '2025-12-27 22:53:13', NULL, NULL),
(420, 'S', 262, '0262-1', 267, 791, 1, 6500.0000, 6500.0000, 75.0000, 11375.0000, 11375.0000, '2025-12-02 22:45:56', '2025-12-27 22:53:14', NULL, NULL),
(421, 'M', 262, '0262-2', 267, 792, 2, 6500.0000, 6500.0000, 75.0000, 11375.0000, 11375.0000, '2025-12-02 22:45:56', '2025-12-27 22:53:14', NULL, NULL),
(422, 'L', 262, '0262-3', 267, 793, 3, 6500.0000, 6500.0000, 75.0000, 11375.0000, 11375.0000, '2025-12-02 22:45:56', '2025-12-27 22:53:14', NULL, NULL),
(423, 'S', 263, '0263-1', 268, 794, 1, 8500.0000, 8500.0000, 75.0000, 14875.0000, 14875.0000, '2025-12-02 22:48:06', '2025-12-27 22:53:16', NULL, NULL),
(424, 'M', 263, '0263-2', 268, 795, 2, 8500.0000, 8500.0000, 75.0000, 14875.0000, 14875.0000, '2025-12-02 22:48:06', '2025-12-27 22:53:16', NULL, NULL),
(425, 'L', 263, '0263-3', 268, 796, 3, 8500.0000, 8500.0000, 75.0000, 14875.0000, 14875.0000, '2025-12-02 22:48:06', '2025-12-27 22:53:16', NULL, NULL),
(426, 'M', 264, '0264-1', 269, 797, 2, 11900.0000, 11900.0000, 75.0000, 20825.0000, 20825.0000, '2025-12-02 22:49:56', '2025-12-27 22:53:17', NULL, NULL),
(427, 'L', 264, '0264-2', 269, 798, 3, 11900.0000, 11900.0000, 75.0000, 20825.0000, 20825.0000, '2025-12-02 22:49:56', '2025-12-27 22:53:17', NULL, NULL),
(428, 'M', 265, '0265-1', 270, 799, 2, 5300.0000, 5300.0000, 75.0000, 9275.0000, 9275.0000, '2025-12-02 22:52:59', '2025-12-27 22:53:18', NULL, NULL),
(429, 'S', 266, '0266-1', 271, 800, 1, 6500.0000, 6500.0000, 75.0000, 11375.0000, 11375.0000, '2025-12-02 22:55:20', '2025-12-27 22:53:19', NULL, NULL),
(430, 'M', 266, '0266-2', 271, 801, 2, 6500.0000, 6500.0000, 75.0000, 11375.0000, 11375.0000, '2025-12-02 22:55:20', '2025-12-27 22:53:19', NULL, NULL),
(431, 'L', 266, '0266-3', 271, 802, 3, 6500.0000, 6500.0000, 75.0000, 11375.0000, 11375.0000, '2025-12-02 22:55:20', '2025-12-27 22:53:19', NULL, NULL),
(432, 'S', 267, '0267-1', 272, 803, 1, 12500.0000, 12500.0000, 75.0000, 21875.0000, 21875.0000, '2025-12-02 22:58:44', '2025-12-27 22:53:20', NULL, NULL),
(433, 'M', 267, '0267-2', 272, 804, 2, 12500.0000, 12500.0000, 75.0000, 21875.0000, 21875.0000, '2025-12-02 22:58:44', '2025-12-27 22:53:20', NULL, NULL),
(434, 'S', 268, '0268-1', 273, 805, 1, 5000.0000, 5000.0000, 75.0000, 8750.0000, 8750.0000, '2025-12-02 23:01:07', '2025-12-27 22:53:22', NULL, NULL),
(435, 'M', 268, '0268-2', 273, 806, 2, 5000.0000, 5000.0000, 75.0000, 8750.0000, 8750.0000, '2025-12-02 23:01:07', '2025-12-27 22:53:22', NULL, NULL),
(436, 'L', 268, '0268-3', 273, 807, 3, 5000.0000, 5000.0000, 75.0000, 8750.0000, 8750.0000, '2025-12-02 23:01:07', '2025-12-27 22:53:22', NULL, NULL),
(437, 'S', 269, '0269-1', 274, 808, 1, 5500.0000, 5500.0000, 75.0000, 9625.0000, 9625.0000, '2025-12-02 23:03:19', '2025-12-27 22:53:23', NULL, NULL),
(438, 'M', 269, '0269-2', 274, 809, 2, 5500.0000, 5500.0000, 75.0000, 9625.0000, 9625.0000, '2025-12-02 23:03:19', '2025-12-27 22:53:23', NULL, NULL),
(439, 'S', 270, '0270-1', 275, 810, 1, 5500.0000, 5500.0000, 75.0000, 9625.0000, 9625.0000, '2025-12-02 23:05:16', '2025-12-27 22:53:24', NULL, NULL),
(440, 'M', 270, '0270-2', 275, 811, 2, 5500.0000, 5500.0000, 75.0000, 9625.0000, 9625.0000, '2025-12-02 23:05:16', '2025-12-27 22:53:24', NULL, NULL),
(441, 'L', 270, '0270-3', 275, 812, 3, 5500.0000, 5500.0000, 75.0000, 9625.0000, 9625.0000, '2025-12-02 23:05:16', '2025-12-27 22:53:24', NULL, NULL),
(442, 'S', 271, '0271-1', 276, 813, 1, 5000.0000, 5000.0000, 75.0000, 8750.0000, 8750.0000, '2025-12-02 23:07:03', '2025-12-27 22:53:25', NULL, NULL),
(443, 'S', 272, '0272-1', 277, 814, 1, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-12-03 00:01:35', '2025-12-27 22:53:26', NULL, NULL),
(444, 'XL', 96, '0096-2', 278, 292, 4, 7450.0000, 7450.0000, 75.0000, 13037.5000, 13037.5000, '2025-12-03 22:12:02', '2025-12-27 22:47:11', NULL, NULL),
(445, 'DUMMY', 273, '0273', 279, NULL, NULL, 12000.0000, 12000.0000, 75.0000, 21000.0000, 21000.0000, '2025-12-06 10:02:39', '2025-12-27 22:32:30', NULL, '[]'),
(446, 'DUMMY', 274, '0274', 280, NULL, NULL, 17000.0000, 17000.0000, 75.0000, 29750.0000, 29750.0000, '2025-12-06 10:40:58', '2025-12-27 22:32:30', NULL, '[]'),
(447, '38', 275, '0275-1', 281, 815, 24, 17000.0000, 17000.0000, 75.0000, 29750.0000, 29750.0000, '2025-12-07 18:59:02', '2025-12-27 22:53:28', NULL, NULL),
(448, '40', 275, '0275-2', 281, 816, 25, 17000.0000, 17000.0000, 75.0000, 29750.0000, 29750.0000, '2025-12-07 18:59:02', '2025-12-27 22:53:28', NULL, NULL),
(449, '42', 275, '0275-3', 281, 817, 26, 17000.0000, 17000.0000, 75.0000, 29750.0000, 29750.0000, '2025-12-07 18:59:02', '2025-12-27 22:53:28', NULL, NULL),
(450, 'Amarillo', 276, '0276-1', 282, 818, 11, 16000.0000, 16000.0000, 75.0000, 28000.0000, 28000.0000, '2025-12-07 20:07:05', '2025-12-27 22:53:29', NULL, NULL),
(451, 'Verde', 276, '0276-2', 282, 819, 12, 16600.0000, 16600.0000, 75.0000, 29050.0000, 29050.0000, '2025-12-07 20:07:05', '2025-12-27 22:53:29', NULL, NULL),
(452, 'Naranja', 276, '0276-3', 282, 820, 31, 16000.0000, 16000.0000, 75.0000, 28000.0000, 28000.0000, '2025-12-07 20:07:05', '2025-12-27 22:53:29', NULL, NULL),
(453, 'M', 277, '0277-1', 283, 821, 2, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-07 20:19:14', '2025-12-27 22:53:30', NULL, NULL),
(454, 'L', 277, '0277-2', 283, 822, 3, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-07 20:19:14', '2025-12-27 22:53:30', NULL, NULL),
(455, '38', 278, '0278-1', 284, 823, 24, 16000.0000, 16000.0000, 75.0000, 28000.0000, 28000.0000, '2025-12-21 23:35:58', '2025-12-27 22:53:32', NULL, NULL),
(456, '40', 278, '0278-2', 284, 824, 25, 16000.0000, 16000.0000, 75.0000, 28000.0000, 28000.0000, '2025-12-21 23:35:58', '2025-12-27 22:53:32', NULL, NULL),
(457, '42', 278, '0278-3', 284, 825, 26, 16000.0000, 16000.0000, 75.0000, 28000.0000, 28000.0000, '2025-12-21 23:35:58', '2025-12-27 22:53:32', NULL, NULL),
(458, 'DUMMY', 279, '0279', 285, NULL, NULL, 10000.0000, 10000.0000, 75.0000, 17500.0000, 17500.0000, '2025-12-22 01:15:52', '2025-12-27 22:32:30', NULL, '[]'),
(459, 'XXL', 241, '0241-5', 286, 742, 5, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-22 01:34:08', '2025-12-27 22:52:49', NULL, NULL),
(460, 'XL', 250, '0250-4', 287, 764, 4, 15000.0000, 15000.0000, 75.0000, 26250.0000, 26250.0000, '2025-12-22 02:15:54', '2025-12-27 22:52:59', NULL, NULL),
(461, '36', 280, '0280-1', 288, 826, 23, 16500.0000, 16500.0000, 75.0000, 28875.0000, 28875.0000, '2025-12-26 16:35:33', '2025-12-27 22:53:34', NULL, NULL),
(462, '38', 280, '0280-2', 288, 827, 24, 16500.0000, 16500.0000, 75.0000, 28875.0000, 28875.0000, '2025-12-26 16:35:33', '2025-12-27 22:53:34', NULL, NULL),
(463, '40', 280, '0280-3', 288, 828, 25, 16500.0000, 16500.0000, 75.0000, 28875.0000, 28875.0000, '2025-12-26 16:35:33', '2025-12-27 22:53:34', NULL, NULL),
(464, '42', 280, '0280-4', 288, 829, 26, 16500.0000, 16500.0000, 75.0000, 28875.0000, 28875.0000, '2025-12-26 16:35:33', '2025-12-27 22:53:34', NULL, NULL),
(465, '44', 280, '0280-5', 288, 830, 27, 16500.0000, 16500.0000, 75.0000, 28875.0000, 28875.0000, '2025-12-26 16:35:33', '2025-12-27 22:53:34', NULL, NULL),
(466, '36', 281, '0281-1', 289, 831, 23, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-26 16:37:18', '2025-12-27 22:53:35', NULL, NULL),
(467, '38', 281, '0281-2', 289, 832, 24, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-26 16:37:18', '2025-12-27 22:53:35', NULL, NULL),
(468, '40', 281, '0281-3', 289, 833, 25, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-26 16:37:18', '2025-12-27 22:53:35', NULL, NULL),
(469, '42', 281, '0281-4', 289, 834, 26, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-26 16:37:18', '2025-12-27 22:53:35', NULL, NULL),
(470, '44', 281, '0281-5', 289, 835, 27, 18000.0000, 18000.0000, 75.0000, 31500.0000, 31500.0000, '2025-12-26 16:37:18', '2025-12-27 22:53:35', NULL, NULL),
(471, '36', 282, '0282-1', 290, 836, 23, 21000.0000, 21000.0000, 75.0000, 36750.0000, 36750.0000, '2025-12-26 16:40:55', '2025-12-27 22:53:37', NULL, NULL),
(472, '38', 282, '0282-2', 290, 837, 24, 21000.0000, 21000.0000, 75.0000, 36750.0000, 36750.0000, '2025-12-26 16:40:55', '2025-12-27 22:53:37', NULL, NULL),
(473, '40', 282, '0282-3', 290, 838, 25, 21000.0000, 21000.0000, 75.0000, 36750.0000, 36750.0000, '2025-12-26 16:40:55', '2025-12-27 22:53:37', NULL, NULL),
(474, '42', 282, '0282-4', 290, 839, 26, 21000.0000, 21000.0000, 75.0000, 36750.0000, 36750.0000, '2025-12-26 16:40:55', '2025-12-27 22:53:37', NULL, NULL),
(475, '44', 282, '0282-5', 290, 840, 27, 21000.0000, 21000.0000, 75.0000, 36750.0000, 36750.0000, '2025-12-26 16:40:55', '2025-12-27 22:53:37', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `variation_group_prices`
--

CREATE TABLE `variation_group_prices` (
  `id` int(10) UNSIGNED NOT NULL,
  `variation_id` int(10) UNSIGNED NOT NULL,
  `price_group_id` int(10) UNSIGNED NOT NULL,
  `price_inc_tax` decimal(22,4) NOT NULL,
  `price_type` varchar(191) NOT NULL DEFAULT 'fixed',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `variation_location_details`
--

CREATE TABLE `variation_location_details` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `product_variation_id` int(10) UNSIGNED NOT NULL COMMENT 'id from product_variations table',
  `variation_id` int(10) UNSIGNED NOT NULL,
  `location_id` int(10) UNSIGNED NOT NULL,
  `qty_available` decimal(22,4) NOT NULL DEFAULT 0.0000,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `variation_location_details`
--

INSERT INTO `variation_location_details` (`id`, `product_id`, `product_variation_id`, `variation_id`, `location_id`, `qty_available`, `created_at`, `updated_at`) VALUES
(8, 259, 264, 412, 1, 2.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(9, 259, 264, 413, 1, 1.0000, '2025-12-02 23:22:18', '2025-12-31 20:28:28'),
(10, 260, 265, 414, 1, 1.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(11, 260, 265, 415, 1, 1.0000, '2025-12-02 23:22:18', '2025-12-31 20:28:28'),
(12, 260, 265, 416, 1, 1.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(13, 261, 266, 417, 1, 1.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(14, 261, 266, 418, 1, 2.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(15, 261, 266, 419, 1, 0.0000, '2025-12-02 23:22:18', '2025-12-31 20:28:28'),
(16, 262, 267, 420, 1, 1.0000, '2025-12-02 23:22:18', '2025-12-21 23:45:11'),
(17, 262, 267, 421, 1, 5.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(18, 262, 267, 422, 1, 0.0000, '2025-12-02 23:22:18', '2025-12-21 23:13:37'),
(19, 263, 268, 423, 1, 2.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(20, 263, 268, 424, 1, 1.0000, '2025-12-02 23:22:18', '2025-12-21 23:17:48'),
(21, 263, 268, 425, 1, 1.0000, '2025-12-02 23:22:18', '2025-12-30 01:32:36'),
(22, 264, 269, 426, 1, 1.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(23, 264, 269, 427, 1, 1.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(24, 265, 270, 428, 1, 2.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(25, 266, 271, 429, 1, 4.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(26, 266, 271, 430, 1, 3.0000, '2025-12-02 23:22:18', '2025-12-30 01:38:54'),
(27, 266, 271, 431, 1, 1.0000, '2025-12-02 23:22:18', '2025-12-21 22:59:46'),
(28, 267, 272, 432, 1, 2.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(29, 267, 272, 433, 1, 2.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(30, 268, 273, 434, 1, 2.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(31, 268, 273, 435, 1, 2.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(32, 268, 273, 436, 1, 2.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(33, 269, 274, 437, 1, 3.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(34, 269, 274, 438, 1, 1.0000, '2025-12-02 23:22:18', '2025-12-22 00:24:56'),
(35, 270, 275, 439, 1, 1.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(36, 270, 275, 440, 1, 1.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(37, 270, 275, 441, 1, 1.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(38, 271, 276, 442, 1, 1.0000, '2025-12-02 23:22:18', '2025-12-02 23:22:18'),
(39, 40, 41, 80, 1, 1.0000, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(40, 40, 41, 81, 1, 1.0000, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(41, 40, 41, 82, 1, 1.0000, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(42, 41, 42, 83, 1, 1.0000, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(43, 42, 43, 84, 1, 1.0000, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(44, 42, 43, 85, 1, 1.0000, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(45, 43, 44, 86, 1, 1.0000, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(46, 44, 45, 87, 1, 1.0000, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(47, 45, 46, 88, 1, 1.0000, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(48, 45, 46, 89, 1, 1.0000, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(49, 47, 48, 91, 1, 1.0000, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(50, 48, 49, 92, 1, 1.0000, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(51, 49, 50, 93, 1, 1.0000, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(52, 50, 51, 94, 1, 1.0000, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(53, 50, 51, 95, 1, 1.0000, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(54, 51, 52, 96, 1, 1.0000, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(55, 51, 52, 97, 1, 0.0000, '2025-12-02 23:32:08', '2025-12-30 01:24:03'),
(56, 46, 47, 90, 1, 1.0000, '2025-12-02 23:32:08', '2025-12-02 23:32:08'),
(57, 132, 134, 212, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(58, 133, 135, 213, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(59, 134, 136, 214, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(60, 135, 137, 215, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(61, 136, 138, 216, 1, 2.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(62, 273, 279, 445, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(63, 138, 140, 218, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(64, 139, 141, 219, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-30 01:32:36'),
(65, 140, 142, 220, 1, 2.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(66, 140, 142, 221, 1, 0.0000, '2025-12-06 10:12:31', '2025-12-30 01:53:24'),
(67, 141, 143, 222, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(68, 142, 144, 223, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(69, 143, 145, 224, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(70, 144, 146, 225, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(71, 144, 146, 226, 1, 0.0000, '2025-12-06 10:12:31', '2026-01-02 17:03:20'),
(72, 145, 147, 227, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(73, 146, 148, 228, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(74, 147, 149, 229, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(75, 148, 150, 230, 1, 0.0000, '2025-12-06 10:12:31', '2026-01-02 17:03:20'),
(76, 149, 151, 231, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(77, 150, 152, 232, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(78, 151, 153, 233, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(79, 152, 154, 234, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(80, 153, 155, 235, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(81, 154, 156, 236, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(82, 155, 157, 237, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(83, 156, 158, 238, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(84, 157, 159, 239, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(85, 158, 160, 240, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(86, 159, 161, 241, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(87, 160, 162, 242, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(88, 161, 163, 243, 1, 0.0000, '2025-12-06 10:12:31', '2025-12-30 01:32:36'),
(89, 162, 164, 244, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(90, 162, 164, 245, 1, 1.0000, '2025-12-06 10:12:31', '2025-12-06 10:12:31'),
(91, 175, 177, 263, 1, 0.0000, '2025-12-06 10:53:49', '2025-12-21 22:59:46'),
(92, 176, 178, 264, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(93, 177, 179, 265, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(94, 177, 200, 287, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(95, 178, 180, 266, 1, 0.0000, '2025-12-06 10:53:49', '2025-12-08 19:54:14'),
(96, 179, 181, 267, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(97, 179, 181, 268, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(98, 180, 182, 269, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(99, 181, 183, 270, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(100, 182, 184, 271, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(101, 183, 185, 272, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(102, 183, 193, 280, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(103, 184, 186, 273, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(104, 185, 187, 274, 1, 0.0000, '2025-12-06 10:53:49', '2026-01-03 16:22:05'),
(105, 186, 188, 275, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(106, 274, 280, 446, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(107, 188, 190, 277, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(108, 189, 191, 278, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(109, 190, 192, 279, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(110, 191, 194, 281, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(111, 192, 195, 282, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(112, 193, 196, 283, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(113, 194, 197, 284, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(114, 195, 198, 285, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(115, 196, 199, 286, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(116, 197, 201, 288, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(117, 198, 202, 289, 1, 1.0000, '2025-12-06 10:53:49', '2025-12-06 10:53:49'),
(118, 199, 203, 290, 1, 1.0000, '2025-12-07 19:00:46', '2025-12-07 19:00:46'),
(119, 200, 204, 291, 1, 1.0000, '2025-12-07 19:00:46', '2025-12-07 19:00:46'),
(120, 200, 204, 292, 1, 1.0000, '2025-12-07 19:00:46', '2025-12-07 19:00:46'),
(121, 201, 205, 293, 1, 1.0000, '2025-12-07 19:00:46', '2025-12-07 19:00:46'),
(122, 201, 205, 294, 1, 1.0000, '2025-12-07 19:00:46', '2025-12-07 19:00:46'),
(123, 201, 205, 295, 1, 1.0000, '2025-12-07 19:00:46', '2025-12-07 19:00:46'),
(124, 201, 205, 296, 1, 1.0000, '2025-12-07 19:00:46', '2025-12-07 19:00:46'),
(125, 202, 206, 297, 1, 1.0000, '2025-12-07 19:00:46', '2025-12-07 19:00:46'),
(126, 202, 206, 298, 1, 1.0000, '2025-12-07 19:00:46', '2025-12-07 19:00:46'),
(127, 275, 281, 447, 1, 0.0000, '2025-12-07 19:00:46', '2025-12-30 01:38:54'),
(128, 275, 281, 448, 1, 1.0000, '2025-12-07 19:00:46', '2025-12-07 19:00:46'),
(129, 275, 281, 449, 1, 1.0000, '2025-12-07 19:00:46', '2025-12-07 19:00:46'),
(130, 204, 208, 302, 1, 1.0000, '2025-12-07 19:00:47', '2025-12-07 19:00:47'),
(131, 204, 208, 303, 1, 1.0000, '2025-12-07 19:00:47', '2025-12-07 19:00:47'),
(132, 205, 209, 304, 1, 1.0000, '2025-12-07 19:00:47', '2025-12-07 19:00:47'),
(133, 205, 209, 305, 1, 1.0000, '2025-12-07 19:00:47', '2025-12-07 19:00:47'),
(134, 205, 209, 306, 1, 1.0000, '2025-12-07 19:00:47', '2025-12-07 19:00:47'),
(135, 205, 210, 307, 1, 1.0000, '2025-12-07 19:00:47', '2025-12-07 19:00:47'),
(136, 206, 211, 308, 1, 1.0000, '2025-12-07 19:00:47', '2025-12-07 19:00:47'),
(137, 206, 211, 309, 1, 1.0000, '2025-12-07 19:00:47', '2025-12-07 19:00:47'),
(138, 206, 211, 310, 1, 1.0000, '2025-12-07 19:00:47', '2025-12-07 19:00:47'),
(139, 207, 212, 311, 1, 1.0000, '2025-12-07 19:00:47', '2025-12-07 19:00:47'),
(140, 207, 212, 312, 1, 1.0000, '2025-12-07 19:00:47', '2025-12-07 19:00:47'),
(141, 207, 212, 313, 1, 1.0000, '2025-12-07 19:00:47', '2025-12-07 19:00:47'),
(142, 208, 213, 314, 1, 1.0000, '2025-12-07 19:00:47', '2025-12-07 19:00:47'),
(143, 208, 213, 315, 1, 0.0000, '2025-12-07 19:00:47', '2025-12-21 23:17:48'),
(144, 208, 213, 316, 1, 1.0000, '2025-12-07 19:00:47', '2025-12-07 19:00:47'),
(145, 209, 214, 317, 1, 1.0000, '2025-12-07 19:00:47', '2025-12-07 19:00:47'),
(146, 209, 214, 318, 1, 1.0000, '2025-12-07 19:00:47', '2025-12-07 19:00:47'),
(147, 209, 214, 319, 1, 1.0000, '2025-12-07 19:00:47', '2025-12-07 19:00:47'),
(148, 163, 165, 246, 1, 1.0000, '2025-12-07 19:01:00', '2025-12-07 19:01:00'),
(149, 164, 166, 247, 1, 1.0000, '2025-12-07 19:01:00', '2025-12-07 19:01:00'),
(150, 165, 167, 248, 1, 2.0000, '2025-12-07 19:01:00', '2025-12-07 19:01:00'),
(151, 165, 167, 249, 1, 2.0000, '2025-12-07 19:01:00', '2025-12-07 19:01:00'),
(152, 166, 168, 250, 1, 1.0000, '2025-12-07 19:01:00', '2025-12-07 19:01:00'),
(153, 166, 168, 251, 1, 0.0000, '2025-12-07 19:01:00', '2025-12-30 01:32:36'),
(154, 167, 169, 252, 1, 1.0000, '2025-12-07 19:01:00', '2025-12-07 19:01:00'),
(155, 168, 170, 253, 1, 1.0000, '2025-12-07 19:01:00', '2025-12-07 19:01:00'),
(156, 169, 171, 254, 1, 1.0000, '2025-12-07 19:01:00', '2025-12-07 19:01:00'),
(157, 169, 171, 255, 1, 0.0000, '2025-12-07 19:01:00', '2025-12-21 23:37:22'),
(158, 169, 171, 256, 1, 1.0000, '2025-12-07 19:01:00', '2025-12-07 19:01:00'),
(159, 170, 172, 257, 1, 2.0000, '2025-12-07 19:01:00', '2025-12-07 19:01:00'),
(160, 170, 172, 258, 1, 1.0000, '2025-12-07 19:01:00', '2025-12-07 19:01:00'),
(161, 171, 173, 259, 1, 0.0000, '2025-12-07 19:01:00', '2025-12-21 23:13:37'),
(162, 172, 174, 260, 1, 2.0000, '2025-12-07 19:01:00', '2025-12-07 19:01:00'),
(163, 173, 175, 261, 1, 1.0000, '2025-12-07 19:01:00', '2025-12-07 19:01:00'),
(164, 174, 176, 262, 1, 1.0000, '2025-12-07 19:01:00', '2025-12-07 19:01:00'),
(165, 117, 119, 186, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(166, 118, 120, 187, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(167, 118, 120, 188, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(168, 118, 120, 189, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(169, 119, 121, 190, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(170, 120, 122, 191, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(171, 121, 123, 192, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(172, 122, 124, 193, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(173, 122, 124, 194, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(174, 122, 124, 195, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(175, 123, 125, 196, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(176, 123, 125, 197, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(177, 124, 126, 198, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(178, 124, 126, 199, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(179, 124, 126, 200, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(180, 125, 127, 201, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(181, 126, 128, 202, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(182, 127, 129, 203, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(183, 128, 130, 204, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(184, 128, 130, 205, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(185, 128, 130, 206, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(186, 129, 131, 207, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(187, 129, 131, 208, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(188, 130, 132, 209, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(189, 131, 133, 210, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(190, 131, 133, 211, 1, 1.0000, '2025-12-07 19:01:05', '2025-12-07 19:01:05'),
(191, 76, 77, 134, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(192, 77, 78, 135, 1, 0.0000, '2025-12-07 19:01:10', '2025-12-31 20:28:28'),
(193, 78, 79, 136, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(194, 79, 80, 137, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(195, 80, 81, 138, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(196, 81, 82, 139, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(197, 82, 83, 140, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(198, 83, 84, 141, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(199, 84, 85, 142, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(200, 85, 86, 143, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(201, 86, 87, 144, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(202, 87, 88, 145, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(203, 88, 89, 146, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(204, 89, 90, 147, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(205, 90, 91, 148, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(206, 91, 92, 149, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(207, 92, 93, 150, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(208, 93, 94, 151, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(209, 94, 95, 152, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(210, 95, 96, 153, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(211, 95, 96, 154, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(212, 96, 97, 155, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(213, 97, 98, 156, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(214, 98, 99, 157, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(215, 98, 99, 158, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(216, 98, 99, 159, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(217, 99, 100, 160, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(218, 100, 101, 161, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(219, 100, 101, 162, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(220, 101, 102, 163, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(221, 102, 103, 164, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(222, 103, 104, 165, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(223, 104, 105, 166, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(224, 104, 105, 167, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(225, 105, 106, 168, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(226, 106, 107, 169, 1, 2.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(227, 106, 107, 170, 1, 2.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(228, 107, 108, 171, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(229, 107, 108, 172, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(230, 108, 110, 174, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(231, 109, 111, 175, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(232, 109, 111, 176, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(233, 109, 111, 177, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(234, 110, 112, 178, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(235, 111, 113, 179, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(236, 112, 114, 180, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(237, 113, 115, 181, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(238, 114, 116, 182, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(239, 114, 116, 183, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(240, 115, 117, 184, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(241, 116, 118, 185, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(242, 272, 277, 443, 1, 1.0000, '2025-12-07 19:01:10', '2025-12-07 19:01:10'),
(243, 67, 68, 117, 1, 1.0000, '2025-12-07 19:01:17', '2025-12-07 19:01:17'),
(244, 68, 69, 118, 1, 1.0000, '2025-12-07 19:01:17', '2025-12-07 19:01:17'),
(245, 69, 70, 119, 1, 1.0000, '2025-12-07 19:01:17', '2025-12-07 19:01:17'),
(246, 69, 70, 120, 1, 0.0000, '2025-12-07 19:01:17', '2025-12-30 01:38:54'),
(247, 69, 70, 121, 1, 0.0000, '2025-12-07 19:01:17', '2025-12-30 01:32:36'),
(248, 75, 76, 132, 1, 1.0000, '2025-12-07 19:01:17', '2025-12-07 19:01:17'),
(249, 75, 76, 133, 1, 1.0000, '2025-12-07 19:01:17', '2025-12-07 19:01:17'),
(250, 71, 72, 124, 1, 3.0000, '2025-12-07 19:01:17', '2025-12-07 19:01:17'),
(251, 72, 73, 125, 1, 1.0000, '2025-12-07 19:01:17', '2025-12-07 19:01:17'),
(252, 72, 73, 126, 1, 1.0000, '2025-12-07 19:01:17', '2025-12-07 19:01:17'),
(253, 72, 73, 127, 1, 1.0000, '2025-12-07 19:01:17', '2025-12-07 19:01:17'),
(254, 73, 74, 128, 1, 2.0000, '2025-12-07 19:01:17', '2025-12-07 19:01:17'),
(255, 73, 74, 129, 1, 2.0000, '2025-12-07 19:01:17', '2025-12-07 19:01:17'),
(256, 74, 75, 130, 1, 1.0000, '2025-12-07 19:01:17', '2025-12-07 19:01:17'),
(257, 74, 75, 131, 1, 1.0000, '2025-12-07 19:01:17', '2025-12-07 19:01:17'),
(258, 70, 71, 122, 1, 2.0000, '2025-12-07 19:01:17', '2025-12-07 19:01:17'),
(259, 70, 71, 123, 1, 1.0000, '2025-12-07 19:01:17', '2025-12-07 19:01:17'),
(260, 52, 53, 98, 1, 1.0000, '2025-12-07 19:01:22', '2025-12-07 19:01:22'),
(261, 53, 54, 99, 1, 1.0000, '2025-12-07 19:01:22', '2025-12-07 19:01:22'),
(262, 54, 55, 100, 1, 0.0000, '2025-12-07 19:01:22', '2025-12-21 22:54:08'),
(263, 55, 56, 101, 1, 1.0000, '2025-12-07 19:01:22', '2025-12-07 19:01:22'),
(264, 56, 57, 102, 1, 1.0000, '2025-12-07 19:01:22', '2025-12-07 19:01:22'),
(265, 56, 57, 103, 1, 1.0000, '2025-12-07 19:01:22', '2025-12-07 19:01:22'),
(266, 56, 57, 104, 1, 1.0000, '2025-12-07 19:01:22', '2025-12-07 19:01:22'),
(267, 57, 58, 105, 1, 1.0000, '2025-12-07 19:01:22', '2025-12-07 19:01:22'),
(268, 58, 59, 106, 1, 1.0000, '2025-12-07 19:01:22', '2025-12-07 19:01:22'),
(269, 59, 60, 107, 1, 1.0000, '2025-12-07 19:01:22', '2025-12-07 19:01:22'),
(270, 60, 61, 108, 1, 0.0000, '2025-12-07 19:01:22', '2025-12-30 01:21:19'),
(271, 61, 62, 109, 1, 1.0000, '2025-12-07 19:01:22', '2025-12-07 19:01:22'),
(272, 61, 62, 110, 1, 1.0000, '2025-12-07 19:01:22', '2025-12-07 19:01:22'),
(273, 62, 63, 111, 1, 1.0000, '2025-12-07 19:01:22', '2025-12-07 19:01:22'),
(274, 63, 64, 112, 1, 1.0000, '2025-12-07 19:01:22', '2025-12-07 19:01:22'),
(275, 64, 65, 113, 1, 1.0000, '2025-12-07 19:01:22', '2025-12-07 19:01:22'),
(276, 65, 66, 114, 1, 1.0000, '2025-12-07 19:01:22', '2025-12-07 19:01:22'),
(277, 65, 66, 115, 1, 1.0000, '2025-12-07 19:01:22', '2025-12-07 19:01:22'),
(278, 66, 67, 116, 1, 1.0000, '2025-12-07 19:01:22', '2025-12-07 19:01:22'),
(279, 210, 215, 320, 1, 1.0000, '2025-12-07 19:10:33', '2025-12-07 19:10:33'),
(280, 211, 216, 321, 1, 2.0000, '2025-12-07 19:10:33', '2025-12-07 19:10:33'),
(281, 212, 217, 322, 1, 1.0000, '2025-12-07 19:10:33', '2025-12-07 19:10:33'),
(282, 213, 218, 323, 1, 1.0000, '2025-12-07 19:10:33', '2025-12-07 19:10:33'),
(283, 214, 219, 324, 1, 1.0000, '2025-12-07 19:10:33', '2025-12-07 19:10:33'),
(284, 215, 220, 325, 1, 1.0000, '2025-12-07 19:10:33', '2025-12-07 19:10:33'),
(285, 216, 221, 326, 1, 1.0000, '2025-12-07 19:10:33', '2025-12-08 17:25:11'),
(286, 217, 222, 327, 1, 1.0000, '2025-12-07 19:10:33', '2025-12-07 19:10:33'),
(287, 218, 223, 328, 1, 0.0000, '2025-12-07 19:10:33', '2025-12-08 19:54:14'),
(288, 219, 224, 329, 1, 2.0000, '2025-12-07 19:10:33', '2025-12-07 19:10:33'),
(289, 220, 225, 330, 1, 3.0000, '2025-12-07 19:10:33', '2025-12-07 19:10:33'),
(290, 221, 226, 331, 1, 1.0000, '2025-12-07 19:10:33', '2025-12-07 19:10:33'),
(291, 222, 227, 332, 1, 1.0000, '2025-12-07 19:10:33', '2025-12-07 19:10:33'),
(292, 223, 228, 333, 1, 1.0000, '2025-12-07 19:10:33', '2025-12-07 19:10:33'),
(293, 224, 229, 334, 1, 1.0000, '2025-12-07 19:10:33', '2025-12-07 19:10:33'),
(294, 225, 230, 335, 1, 1.0000, '2025-12-07 19:10:33', '2025-12-07 19:10:33'),
(295, 226, 231, 336, 1, 1.0000, '2025-12-07 19:10:33', '2025-12-07 19:10:33'),
(296, 227, 232, 337, 1, 1.0000, '2025-12-07 19:10:33', '2025-12-08 19:54:14'),
(297, 228, 233, 338, 1, 2.0000, '2025-12-07 19:10:33', '2025-12-07 19:10:33'),
(298, 229, 234, 339, 1, 2.0000, '2025-12-07 19:10:33', '2025-12-07 19:10:33'),
(299, 276, 282, 450, 1, 1.0000, '2025-12-07 20:09:59', '2025-12-07 20:09:59'),
(300, 276, 282, 451, 1, 1.0000, '2025-12-07 20:09:59', '2025-12-07 20:09:59'),
(301, 276, 282, 452, 1, 1.0000, '2025-12-07 20:09:59', '2025-12-07 20:09:59'),
(302, 231, 236, 343, 1, 1.0000, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(303, 231, 236, 344, 1, 1.0000, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(304, 231, 236, 345, 1, 1.0000, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(305, 232, 237, 346, 1, 1.0000, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(306, 232, 237, 347, 1, 1.0000, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(307, 232, 237, 348, 1, 1.0000, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(308, 233, 238, 349, 1, 1.0000, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(309, 233, 238, 350, 1, 1.0000, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(310, 233, 238, 351, 1, 1.0000, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(311, 234, 239, 352, 1, 1.0000, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(312, 234, 239, 353, 1, 1.0000, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(313, 234, 239, 354, 1, 1.0000, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(314, 235, 240, 355, 1, 1.0000, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(315, 235, 240, 356, 1, 1.0000, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(316, 236, 241, 357, 1, 1.0000, '2025-12-07 20:10:00', '2025-12-07 20:10:00'),
(317, 4, 4, 12, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(318, 4, 4, 13, 1, 0.0000, '2025-12-07 20:25:18', '2025-12-21 23:45:11'),
(319, 5, 5, 14, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(320, 6, 6, 15, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(321, 6, 6, 16, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(322, 6, 7, 17, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(323, 7, 8, 18, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(324, 8, 9, 19, 1, 0.0000, '2025-12-07 20:25:18', '2025-12-31 20:28:28'),
(325, 9, 10, 20, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(326, 9, 10, 21, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(327, 9, 10, 22, 1, 0.0000, '2025-12-07 20:25:18', '2025-12-31 20:28:28'),
(328, 9, 10, 23, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(329, 10, 11, 24, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(330, 11, 12, 25, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(331, 11, 12, 26, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(332, 11, 12, 27, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(333, 277, 283, 453, 1, 2.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(334, 277, 283, 454, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(335, 13, 14, 31, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(336, 13, 14, 32, 1, 0.0000, '2025-12-07 20:25:18', '2025-12-30 01:53:24'),
(337, 14, 15, 33, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(338, 15, 16, 34, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(339, 16, 17, 35, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(340, 18, 19, 37, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(341, 18, 19, 38, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(342, 19, 20, 39, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(343, 19, 20, 40, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(344, 20, 21, 41, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(345, 21, 22, 42, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(346, 21, 22, 43, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(347, 22, 23, 44, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(348, 22, 23, 45, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(349, 22, 23, 46, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(350, 22, 23, 47, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(351, 22, 23, 48, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(352, 22, 23, 49, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(353, 23, 24, 50, 1, 2.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(354, 23, 24, 51, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(355, 24, 25, 52, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(356, 25, 26, 53, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(357, 26, 27, 54, 1, 2.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(358, 26, 27, 55, 1, 2.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(359, 27, 28, 56, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(360, 28, 29, 57, 1, 2.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(361, 29, 30, 58, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(362, 29, 30, 59, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(363, 30, 31, 60, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(364, 30, 31, 61, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(365, 30, 31, 62, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(366, 30, 31, 63, 1, 1.0000, '2025-12-07 20:25:18', '2025-12-07 20:25:18'),
(367, 31, 32, 64, 1, 1.0000, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(368, 31, 32, 65, 1, 1.0000, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(369, 32, 33, 66, 1, 1.0000, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(370, 32, 33, 67, 1, 1.0000, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(371, 33, 34, 68, 1, 1.0000, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(372, 33, 34, 69, 1, 1.0000, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(373, 33, 34, 70, 1, 1.0000, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(374, 34, 35, 71, 1, 1.0000, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(375, 34, 35, 72, 1, 1.0000, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(376, 35, 36, 73, 1, 1.0000, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(377, 36, 37, 74, 1, 1.0000, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(378, 36, 37, 75, 1, 1.0000, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(379, 37, 38, 76, 1, 1.0000, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(380, 37, 38, 77, 1, 1.0000, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(381, 38, 39, 78, 1, 2.0000, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(382, 39, 40, 79, 1, 1.0000, '2025-12-07 20:39:32', '2025-12-07 20:39:32'),
(383, 237, 242, 358, 1, 1.0000, '2025-12-07 21:23:51', '2025-12-07 21:23:51'),
(384, 238, 243, 359, 1, 1.0000, '2025-12-07 21:23:51', '2025-12-07 21:23:51'),
(385, 238, 243, 360, 1, 1.0000, '2025-12-07 21:23:51', '2025-12-07 21:23:51'),
(386, 238, 243, 361, 1, 1.0000, '2025-12-07 21:23:51', '2025-12-07 21:23:51'),
(387, 238, 243, 362, 1, 1.0000, '2025-12-07 21:23:51', '2025-12-07 21:23:51'),
(388, 239, 244, 363, 1, 1.0000, '2025-12-07 21:23:51', '2025-12-07 21:23:51'),
(389, 239, 244, 364, 1, 1.0000, '2025-12-07 21:23:51', '2025-12-07 21:23:51'),
(390, 239, 244, 365, 1, 1.0000, '2025-12-07 21:23:51', '2025-12-07 21:23:51'),
(391, 239, 244, 366, 1, 0.0000, '2025-12-07 21:23:51', '2025-12-30 01:44:08'),
(392, 240, 245, 367, 1, 1.0000, '2025-12-07 21:23:51', '2025-12-07 21:23:51'),
(393, 240, 245, 368, 1, 1.0000, '2025-12-07 21:23:51', '2025-12-07 21:23:51'),
(394, 241, 246, 369, 1, 1.0000, '2025-12-07 21:23:51', '2025-12-07 21:23:51'),
(395, 241, 246, 370, 1, 1.0000, '2025-12-07 21:23:51', '2025-12-07 21:23:51'),
(396, 241, 246, 371, 1, 1.0000, '2025-12-07 21:23:51', '2025-12-07 21:23:51'),
(397, 241, 246, 372, 1, 1.0000, '2025-12-07 21:23:51', '2025-12-07 21:23:51'),
(398, 242, 247, 373, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(399, 242, 247, 374, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(400, 243, 248, 375, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(401, 243, 248, 376, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(402, 244, 249, 377, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(403, 244, 249, 378, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(404, 245, 250, 379, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(405, 245, 250, 380, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(406, 246, 251, 381, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(407, 246, 251, 382, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(408, 246, 251, 383, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(409, 247, 252, 384, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(410, 248, 253, 385, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(411, 248, 253, 386, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(412, 248, 253, 387, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(413, 249, 254, 388, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(414, 249, 254, 389, 1, 0.0000, '2025-12-07 21:23:52', '2025-12-21 23:37:22'),
(415, 249, 254, 390, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(416, 250, 255, 391, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(417, 250, 255, 392, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(418, 250, 255, 393, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(419, 251, 256, 394, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(420, 251, 256, 395, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(421, 252, 257, 396, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(422, 252, 257, 397, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(423, 252, 257, 398, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(424, 253, 258, 399, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(425, 253, 258, 400, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(426, 254, 259, 401, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(427, 254, 259, 402, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(428, 255, 260, 403, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(429, 255, 260, 404, 1, 0.0000, '2025-12-07 21:23:52', '2025-12-30 01:44:08'),
(430, 256, 261, 405, 1, 0.0000, '2025-12-07 21:23:52', '2025-12-21 23:37:22'),
(431, 256, 261, 406, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(432, 257, 262, 407, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(433, 257, 262, 408, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(434, 257, 262, 409, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(435, 258, 263, 410, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(436, 258, 263, 411, 1, 1.0000, '2025-12-07 21:23:52', '2025-12-07 21:23:52'),
(437, 278, 284, 455, 1, 1.0000, '2025-12-21 23:36:22', '2025-12-21 23:36:22'),
(438, 278, 284, 456, 1, 1.0000, '2025-12-21 23:36:22', '2025-12-21 23:36:22'),
(439, 278, 284, 457, 1, 0.0000, '2025-12-21 23:36:22', '2025-12-21 23:37:22'),
(440, 279, 285, 458, 1, 2.0000, '2025-12-22 01:16:01', '2025-12-30 01:53:24'),
(441, 241, 286, 459, 1, 1.0000, '2025-12-22 01:34:15', '2025-12-22 01:34:15'),
(442, 250, 287, 460, 1, 1.0000, '2025-12-22 02:16:00', '2025-12-22 02:16:00'),
(443, 280, 288, 461, 1, 1.0000, '2025-12-26 16:42:38', '2025-12-26 16:42:38'),
(444, 280, 288, 462, 1, 1.0000, '2025-12-26 16:42:38', '2025-12-26 16:42:38'),
(445, 280, 288, 463, 1, 1.0000, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(446, 280, 288, 464, 1, 1.0000, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(447, 280, 288, 465, 1, 1.0000, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(448, 281, 289, 466, 1, 1.0000, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(449, 281, 289, 467, 1, 1.0000, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(450, 281, 289, 468, 1, 1.0000, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(451, 281, 289, 469, 1, 1.0000, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(452, 281, 289, 470, 1, 1.0000, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(453, 282, 290, 471, 1, 1.0000, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(454, 282, 290, 472, 1, 1.0000, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(455, 282, 290, 473, 1, 1.0000, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(456, 282, 290, 474, 1, 1.0000, '2025-12-26 16:42:39', '2025-12-26 16:42:39'),
(457, 282, 290, 475, 1, 1.0000, '2025-12-26 16:42:39', '2025-12-26 16:42:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `variation_templates`
--

CREATE TABLE `variation_templates` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `business_id` int(10) UNSIGNED NOT NULL,
  `woocommerce_attr_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `variation_templates`
--

INSERT INTO `variation_templates` (`id`, `name`, `business_id`, `woocommerce_attr_id`, `created_at`, `updated_at`) VALUES
(1, 'Talles', 1, 1, '2025-10-28 18:58:41', '2025-12-27 22:40:35'),
(2, 'Color', 1, 2, '2025-10-28 18:59:24', '2025-12-27 22:40:36'),
(3, 'Talle pantalon', 1, 3, '2025-11-24 19:07:59', '2025-12-27 22:40:37');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `variation_value_templates`
--

CREATE TABLE `variation_value_templates` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `variation_template_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `variation_value_templates`
--

INSERT INTO `variation_value_templates` (`id`, `name`, `variation_template_id`, `created_at`, `updated_at`) VALUES
(1, 'S', 1, '2025-10-28 18:58:41', '2025-10-28 18:58:41'),
(2, 'M', 1, '2025-10-28 18:58:41', '2025-10-28 18:58:41'),
(3, 'L', 1, '2025-10-28 18:58:41', '2025-10-28 18:58:41'),
(4, 'XL', 1, '2025-10-28 18:58:41', '2025-10-28 18:58:41'),
(5, 'XXL', 1, '2025-10-28 18:58:41', '2025-10-28 18:58:41'),
(6, 'Rojo', 2, '2025-10-28 18:59:24', '2025-10-28 18:59:24'),
(7, 'Negro', 2, '2025-10-28 18:59:24', '2025-10-28 18:59:24'),
(8, 'Azul', 2, '2025-10-28 18:59:24', '2025-10-28 18:59:24'),
(9, 'Blanco', 2, '2025-10-28 18:59:24', '2025-10-28 18:59:24'),
(10, 'Gris', 2, '2025-10-28 18:59:24', '2025-10-28 18:59:24'),
(11, 'Amarillo', 2, '2025-10-28 18:59:24', '2025-10-28 18:59:24'),
(12, 'Verde', 2, '2025-10-28 18:59:24', '2025-10-28 18:59:24'),
(13, 'Rosado', 2, '2025-10-28 18:59:24', '2025-10-28 18:59:24'),
(14, 'Lila', 2, '2025-10-28 18:59:24', '2025-10-28 18:59:24'),
(15, 'Crudo', 2, '2025-11-15 19:29:22', '2025-11-15 19:29:22'),
(16, 'Dorado', 2, '2025-11-15 19:29:22', '2025-11-15 19:29:22'),
(17, 'Beige', 2, '2025-11-15 19:48:28', '2025-11-15 19:48:28'),
(18, 'Celeste', 2, '2025-11-15 20:30:15', '2025-11-15 20:30:15'),
(19, 'Chocolate', 2, '2025-11-15 20:33:17', '2025-11-15 20:33:17'),
(20, 'Marron', 2, '2025-11-15 20:33:17', '2025-11-15 20:33:17'),
(21, 'Marron claro', 2, '2025-11-15 21:50:23', '2025-11-15 21:50:23'),
(22, 'Natural', 2, '2025-11-15 22:08:56', '2025-11-15 22:08:56'),
(23, '36', 3, '2025-11-24 19:07:59', '2025-11-24 19:07:59'),
(24, '38', 3, '2025-11-24 19:07:59', '2025-11-24 19:07:59'),
(25, '40', 3, '2025-11-24 19:07:59', '2025-11-24 19:07:59'),
(26, '42', 3, '2025-11-24 19:07:59', '2025-11-24 19:07:59'),
(27, '44', 3, '2025-11-24 19:07:59', '2025-11-24 19:07:59'),
(28, '46', 3, '2025-11-24 19:07:59', '2025-11-24 19:07:59'),
(29, '48', 3, '2025-11-24 19:07:59', '2025-11-24 19:07:59'),
(30, 'Unico', 1, '2025-11-30 17:16:25', '2025-11-30 17:16:25'),
(31, 'Naranja', 2, '2025-11-30 18:20:29', '2025-11-30 18:20:29');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `warranties`
--

CREATE TABLE `warranties` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `business_id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `duration` int(11) NOT NULL,
  `duration_type` enum('days','months','years') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `woocommerce_sync_logs`
--

CREATE TABLE `woocommerce_sync_logs` (
  `id` int(10) UNSIGNED NOT NULL,
  `business_id` int(11) NOT NULL,
  `sync_type` varchar(191) NOT NULL,
  `operation_type` varchar(191) DEFAULT NULL,
  `data` longtext DEFAULT NULL,
  `details` longtext DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `woocommerce_sync_logs`
--

INSERT INTO `woocommerce_sync_logs` (`id`, `business_id`, `sync_type`, `operation_type`, `data`, `details`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 1, 'orders', NULL, NULL, NULL, 1, '2025-11-22 10:44:36', '2025-11-22 10:44:36'),
(2, 1, 'categories', 'created', '[\"Remeras\",\"Pantalones\",\"Buzos\",\"Short\",\"Pupera\",\"Puperon\",\"Minifalda\",\"Conjunto\",\"Musculosa\",\"Chomba\",\"Camisa\",\"Sudadera\"]', NULL, 1, '2025-11-22 10:54:15', '2025-11-22 10:54:15'),
(7, 1, 'categories', NULL, NULL, NULL, 1, '2025-11-22 11:06:03', '2025-11-22 11:06:03'),
(9, 1, 'categories', NULL, NULL, NULL, 1, '2025-11-22 11:10:31', '2025-11-22 11:10:31'),
(10, 1, 'all_products', 'created', '[\"0004\",\"0005\",\"0006\",\"0007\",\"0008\",\"0009\",\"0010\",\"0011\",\"0013\",\"0014\",\"0015\",\"0016\",\"0018\",\"0019\",\"0020\",\"0021\",\"0022\",\"0023\",\"0024\",\"0025\",\"0026\",\"0027\",\"0028\",\"0029\",\"0030\",\"0031\",\"0032\",\"0033\",\"0034\",\"0035\",\"0036\",\"0037\",\"0038\",\"0039\"]', NULL, 1, '2025-11-22 11:10:51', '2025-11-22 11:10:51'),
(11, 1, 'all_products', NULL, NULL, NULL, 1, '2025-11-22 11:11:47', '2025-11-22 11:11:47'),
(12, 1, 'categories', NULL, NULL, NULL, 1, '2025-11-22 11:13:06', '2025-11-22 11:13:06'),
(13, 1, 'all_products', NULL, NULL, NULL, 1, '2025-11-22 11:13:07', '2025-11-22 11:13:07'),
(14, 1, 'all_products', NULL, NULL, NULL, 1, '2025-11-22 11:13:07', '2025-11-22 11:13:07'),
(15, 1, 'categories', NULL, NULL, NULL, 1, '2025-11-22 11:13:13', '2025-11-22 11:13:13'),
(16, 1, 'new_products', NULL, NULL, NULL, 1, '2025-11-22 11:13:14', '2025-11-22 11:13:14'),
(17, 1, 'categories', NULL, NULL, NULL, 1, '2025-11-22 11:25:24', '2025-11-22 11:25:24'),
(18, 1, 'all_products', NULL, NULL, NULL, 1, '2025-11-22 11:25:26', '2025-11-22 11:25:26'),
(19, 1, 'all_products', NULL, NULL, NULL, 1, '2025-11-22 11:25:26', '2025-11-22 11:25:26'),
(20, 1, 'categories', NULL, NULL, NULL, 1, '2025-11-22 12:10:00', '2025-11-22 12:10:00'),
(21, 1, 'new_products', NULL, NULL, NULL, 1, '2025-11-22 12:10:02', '2025-11-22 12:10:02'),
(22, 1, 'all_products', 'reset', NULL, NULL, 1, '2025-11-22 12:15:44', '2025-11-22 12:15:44'),
(23, 1, 'categories', NULL, NULL, NULL, 1, '2025-11-22 12:15:52', '2025-11-22 12:15:52'),
(24, 1, 'new_products', 'created', '[\"0004\",\"0005\",\"0006\",\"0007\",\"0008\",\"0009\",\"0010\",\"0011\",\"0013\",\"0014\",\"0015\",\"0016\",\"0018\",\"0019\",\"0020\",\"0021\",\"0022\",\"0023\",\"0024\",\"0025\",\"0026\",\"0027\",\"0028\",\"0029\",\"0030\",\"0031\",\"0032\",\"0033\",\"0034\",\"0035\",\"0036\",\"0037\",\"0038\",\"0039\"]', NULL, 1, '2025-11-22 12:15:57', '2025-11-22 12:15:57'),
(25, 1, 'new_products', NULL, NULL, NULL, 1, '2025-11-22 12:16:28', '2025-11-22 12:16:28'),
(26, 1, 'orders', NULL, NULL, NULL, 1, '2025-11-22 12:20:27', '2025-11-22 12:20:27'),
(29, 1, 'categories', 'created', '[\"Cinturones\",\"Tops\",\"Polleras\",\"Vestidos\",\"Sacos\",\"Blazers\",\"Camperas\",\"Blusas\",\"Chalecos\",\"Mallas\",\"Bermudas\"]', NULL, 1, '2025-12-03 12:58:11', '2025-12-03 12:58:11'),
(30, 1, 'categories', 'updated', '[\"Shorts\",\"Puperas\",\"Puperones\",\"Minifaldas\",\"Conjuntos\",\"Musculosas\",\"Chombas\",\"Camisas\",\"Sudaderas\"]', NULL, 1, '2025-12-03 12:58:11', '2025-12-03 12:58:11'),
(32, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-07 21:40:06', '2025-12-07 21:40:06'),
(33, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-07 21:40:10', '2025-12-07 21:40:10'),
(34, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-07 21:40:44', '2025-12-07 21:40:44'),
(35, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-07 21:41:10', '2025-12-07 21:41:10'),
(36, 1, 'all_products', 'created', '[\"0040\",\"0041\",\"0042\",\"0043\",\"0044\",\"0045\",\"0046\",\"0047\",\"0048\",\"0049\",\"0050\",\"0051\",\"0052\",\"0053\",\"0054\",\"0055\",\"0056\",\"0057\",\"0058\",\"0059\",\"0060\",\"0061\",\"0062\",\"0063\",\"0064\",\"0065\",\"0066\",\"0067\",\"0068\",\"0069\",\"0070\",\"0071\",\"0072\",\"0073\",\"0074\",\"0075\",\"0076\",\"0077\",\"0078\",\"0079\",\"0080\",\"0081\",\"0082\",\"0083\",\"0084\",\"0085\",\"0086\",\"0087\",\"0088\",\"0089\",\"0090\",\"0091\",\"0092\",\"0093\",\"0094\",\"0095\",\"0096\",\"0097\",\"0098\",\"0099\",\"0100\",\"0101\",\"0102\",\"0103\",\"0104\",\"0105\"]', NULL, 1, '2025-12-07 21:41:21', '2025-12-07 21:41:21'),
(37, 1, 'all_products', 'updated', '[\"0004\",\"0005\",\"0006\",\"0007\",\"0008\",\"0009\",\"0010\",\"0011\",\"0013\",\"0014\",\"0015\",\"0016\",\"0018\",\"0019\",\"0020\",\"0021\",\"0022\",\"0023\",\"0024\",\"0025\",\"0026\",\"0027\",\"0028\",\"0029\",\"0030\",\"0031\",\"0032\",\"0033\",\"0034\",\"0035\",\"0036\",\"0037\",\"0038\",\"0039\"]', NULL, 1, '2025-12-07 21:41:21', '2025-12-07 21:41:21'),
(38, 1, 'all_products', 'created', '[\"0106\",\"0107\",\"0108\",\"0109\",\"0110\",\"0111\",\"0112\",\"0113\",\"0114\",\"0115\",\"0116\",\"0117\",\"0118\",\"0119\",\"0120\",\"0121\",\"0122\",\"0123\",\"0124\",\"0125\",\"0126\",\"0127\",\"0128\",\"0129\",\"0130\",\"0131\",\"0132\",\"0133\",\"0134\",\"0135\",\"0136\",\"0138\",\"0139\",\"0140\",\"0141\",\"0142\",\"0143\",\"0144\",\"0145\",\"0146\",\"0147\",\"0148\",\"0149\",\"0150\",\"0151\",\"0152\",\"0153\",\"0154\",\"0155\",\"0156\",\"0157\",\"0158\",\"0159\",\"0160\",\"0161\",\"0162\",\"0163\",\"0164\",\"0165\",\"0166\",\"0167\",\"0168\",\"0169\",\"0170\",\"0171\",\"0172\",\"0173\",\"0174\",\"0175\",\"0176\",\"0177\",\"0178\",\"0179\",\"0180\",\"0181\",\"0182\",\"0183\",\"0184\",\"0185\",\"0186\",\"0188\",\"0189\",\"0190\",\"0191\",\"0192\",\"0193\",\"0194\",\"0195\",\"0196\",\"0197\",\"0198\",\"0199\",\"0200\",\"0201\",\"0202\",\"0204\",\"0205\",\"0206\",\"0207\",\"0208\"]', NULL, 1, '2025-12-07 21:43:01', '2025-12-07 21:43:01'),
(39, 1, 'categories', 'reset', NULL, NULL, 1, '2025-12-07 22:15:39', '2025-12-07 22:15:39'),
(40, 1, 'all_products', 'reset', NULL, NULL, 1, '2025-12-07 22:15:45', '2025-12-07 22:15:45'),
(41, 1, 'categories', 'created', '[\"Remeras\",\"Pantalones\",\"Buzos\",\"Shorts\",\"Puperas\",\"Puperones\",\"Minifaldas\",\"Conjuntos\",\"Musculosas\",\"Chombas\",\"Camisas\",\"Sudaderas\",\"Cinturones\",\"Tops\",\"Polleras\",\"Vestidos\",\"Sacos\",\"Blazers\",\"Camperas\",\"Blusas\",\"Chalecos\",\"Mallas\",\"Bermudas\"]', NULL, 1, '2025-12-07 22:15:54', '2025-12-07 22:15:54'),
(45, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-07 22:20:36', '2025-12-07 22:20:36'),
(46, 1, 'new_products', 'created', '[\"0004\",\"0005\",\"0006\",\"0007\",\"0008\",\"0009\",\"0010\",\"0011\",\"0013\",\"0014\",\"0015\",\"0016\",\"0018\",\"0019\",\"0020\",\"0021\",\"0022\",\"0023\",\"0024\",\"0025\",\"0026\",\"0027\",\"0028\",\"0029\",\"0030\",\"0031\",\"0032\",\"0033\",\"0034\",\"0035\",\"0036\",\"0037\",\"0038\",\"0039\",\"0040\",\"0041\",\"0042\",\"0043\",\"0044\",\"0045\",\"0046\",\"0047\",\"0048\",\"0049\",\"0050\",\"0051\",\"0052\",\"0053\",\"0054\",\"0055\",\"0056\",\"0057\",\"0058\",\"0059\",\"0060\",\"0061\",\"0062\",\"0063\",\"0064\",\"0065\",\"0066\",\"0067\",\"0068\",\"0069\",\"0070\",\"0071\",\"0072\",\"0073\",\"0074\",\"0075\",\"0076\",\"0077\",\"0078\",\"0079\",\"0080\",\"0081\",\"0082\",\"0083\",\"0084\",\"0085\",\"0086\",\"0087\",\"0088\",\"0089\",\"0090\",\"0091\",\"0092\",\"0093\",\"0094\",\"0095\",\"0096\",\"0097\",\"0098\",\"0099\",\"0100\",\"0101\",\"0102\",\"0103\",\"0104\",\"0105\"]', NULL, 1, '2025-12-07 22:21:27', '2025-12-07 22:21:27'),
(49, 1, 'all_products', 'reset', NULL, NULL, 1, '2025-12-07 22:35:44', '2025-12-07 22:35:44'),
(50, 1, 'categories', 'reset', NULL, NULL, 1, '2025-12-07 22:35:50', '2025-12-07 22:35:50'),
(51, 1, 'categories', 'created', '[\"Remeras\",\"Pantalones\",\"Buzos\",\"Shorts\",\"Puperas\",\"Puperones\",\"Minifaldas\",\"Conjuntos\",\"Musculosas\",\"Chombas\",\"Camisas\",\"Sudaderas\",\"Cinturones\",\"Tops\",\"Polleras\",\"Vestidos\",\"Sacos\",\"Blazers\",\"Camperas\",\"Blusas\",\"Chalecos\",\"Mallas\",\"Bermudas\"]', NULL, 1, '2025-12-07 22:40:46', '2025-12-07 22:40:46'),
(55, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-07 22:50:12', '2025-12-07 22:50:12'),
(56, 1, 'all_products', 'created', '[\"0004\",\"0005\",\"0006\",\"0007\",\"0008\",\"0009\",\"0010\",\"0011\",\"0013\",\"0014\",\"0015\",\"0016\",\"0018\",\"0019\",\"0020\",\"0021\",\"0022\",\"0023\",\"0024\",\"0025\",\"0026\",\"0027\",\"0028\",\"0029\",\"0030\",\"0031\",\"0032\",\"0033\",\"0034\",\"0035\",\"0036\",\"0037\",\"0038\",\"0039\",\"0040\",\"0041\",\"0042\",\"0043\",\"0044\",\"0045\",\"0046\",\"0047\",\"0048\",\"0049\",\"0050\",\"0051\",\"0052\",\"0053\",\"0054\",\"0055\",\"0056\",\"0057\",\"0058\",\"0059\",\"0060\",\"0061\",\"0062\",\"0063\",\"0064\",\"0065\",\"0066\",\"0067\",\"0068\",\"0069\",\"0070\",\"0071\",\"0072\",\"0073\",\"0074\",\"0075\",\"0076\",\"0077\",\"0078\",\"0079\",\"0080\",\"0081\",\"0082\",\"0083\",\"0084\",\"0085\",\"0086\",\"0087\",\"0088\",\"0089\",\"0090\",\"0091\",\"0092\",\"0093\",\"0094\",\"0095\",\"0096\",\"0097\",\"0098\",\"0099\",\"0100\",\"0101\",\"0102\",\"0103\",\"0104\",\"0105\"]', NULL, 1, '2025-12-07 22:51:02', '2025-12-07 22:51:02'),
(57, 1, 'all_products', 'created', '[\"0106\",\"0107\",\"0108\",\"0109\",\"0110\",\"0111\",\"0112\",\"0113\",\"0114\",\"0115\",\"0116\",\"0117\",\"0118\",\"0119\",\"0120\",\"0121\",\"0122\",\"0123\",\"0124\",\"0125\",\"0126\",\"0127\",\"0128\",\"0129\",\"0130\",\"0131\",\"0132\",\"0133\",\"0134\",\"0135\",\"0136\",\"0138\",\"0139\",\"0140\",\"0141\",\"0142\",\"0143\",\"0144\",\"0145\",\"0146\",\"0147\",\"0148\",\"0149\",\"0150\",\"0151\",\"0152\",\"0153\",\"0154\",\"0155\",\"0156\",\"0157\",\"0158\",\"0159\",\"0160\",\"0161\",\"0162\",\"0163\",\"0164\",\"0165\",\"0166\",\"0167\",\"0168\",\"0169\",\"0170\",\"0171\",\"0172\",\"0173\",\"0174\",\"0175\",\"0176\",\"0177\",\"0178\",\"0179\",\"0180\",\"0181\",\"0182\",\"0183\",\"0184\",\"0185\",\"0186\",\"0188\",\"0189\",\"0190\",\"0191\",\"0192\",\"0193\",\"0194\",\"0195\",\"0196\",\"0197\",\"0198\",\"0199\",\"0200\",\"0201\",\"0202\",\"0204\",\"0205\",\"0206\",\"0207\",\"0208\"]', NULL, 1, '2025-12-07 22:57:30', '2025-12-07 22:57:30'),
(58, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-07 23:42:33', '2025-12-07 23:42:33'),
(59, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:42:35', '2025-12-07 23:42:35'),
(60, 1, 'all_products', 'updated', '[\"0208\"]', NULL, 1, '2025-12-07 23:42:37', '2025-12-07 23:42:37'),
(61, 1, 'all_products', 'created', '[\"0209\",\"0210\",\"0211\",\"0212\",\"0213\",\"0214\",\"0215\",\"0216\",\"0217\",\"0218\",\"0219\",\"0220\",\"0221\",\"0222\",\"0223\",\"0224\",\"0225\",\"0226\",\"0227\",\"0228\",\"0229\",\"0231\",\"0232\",\"0233\",\"0234\",\"0235\",\"0236\",\"0237\",\"0238\",\"0239\",\"0240\",\"0241\",\"0242\",\"0243\",\"0244\",\"0245\",\"0246\",\"0247\",\"0248\",\"0249\",\"0250\",\"0251\",\"0252\",\"0253\",\"0254\",\"0255\",\"0256\",\"0257\",\"0258\",\"0259\",\"0260\",\"0261\",\"0262\",\"0263\",\"0264\",\"0265\",\"0266\",\"0267\",\"0268\",\"0269\",\"0270\",\"0271\",\"0272\",\"0273\",\"0274\",\"0275\",\"0276\",\"0277\"]', NULL, 1, '2025-12-07 23:43:23', '2025-12-07 23:43:23'),
(62, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:44:42', '2025-12-07 23:44:42'),
(63, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-07 23:45:37', '2025-12-07 23:45:37'),
(64, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:45:38', '2025-12-07 23:45:38'),
(65, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:45:39', '2025-12-07 23:45:39'),
(66, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:45:39', '2025-12-07 23:45:39'),
(67, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:45:39', '2025-12-07 23:45:39'),
(68, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-07 23:47:40', '2025-12-07 23:47:40'),
(69, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:47:42', '2025-12-07 23:47:42'),
(70, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:47:42', '2025-12-07 23:47:42'),
(71, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:47:43', '2025-12-07 23:47:43'),
(72, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:47:43', '2025-12-07 23:47:43'),
(73, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-07 23:48:46', '2025-12-07 23:48:46'),
(74, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:48:48', '2025-12-07 23:48:48'),
(75, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:48:48', '2025-12-07 23:48:48'),
(76, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:48:48', '2025-12-07 23:48:48'),
(77, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:48:49', '2025-12-07 23:48:49'),
(78, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-07 23:48:54', '2025-12-07 23:48:54'),
(79, 1, 'new_products', NULL, NULL, NULL, 1, '2025-12-07 23:48:55', '2025-12-07 23:48:55'),
(80, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-07 23:48:57', '2025-12-07 23:48:57'),
(81, 1, 'new_products', NULL, NULL, NULL, 1, '2025-12-07 23:48:58', '2025-12-07 23:48:58'),
(82, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-07 23:49:45', '2025-12-07 23:49:45'),
(83, 1, 'new_products', NULL, NULL, NULL, 1, '2025-12-07 23:49:46', '2025-12-07 23:49:46'),
(84, 1, 'orders', NULL, NULL, NULL, 1, '2025-12-07 23:49:48', '2025-12-07 23:49:48'),
(85, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-07 23:50:33', '2025-12-07 23:50:33'),
(86, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:50:35', '2025-12-07 23:50:35'),
(87, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:50:35', '2025-12-07 23:50:35'),
(88, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:50:35', '2025-12-07 23:50:35'),
(89, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:50:35', '2025-12-07 23:50:35'),
(90, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-07 23:51:04', '2025-12-07 23:51:04'),
(91, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:51:06', '2025-12-07 23:51:06'),
(92, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:51:06', '2025-12-07 23:51:06'),
(93, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:51:06', '2025-12-07 23:51:06'),
(94, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-07 23:51:06', '2025-12-07 23:51:06'),
(95, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-08 00:31:44', '2025-12-08 00:31:44'),
(96, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-08 00:31:46', '2025-12-08 00:31:46'),
(97, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-08 00:31:46', '2025-12-08 00:31:46'),
(98, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-08 00:31:47', '2025-12-08 00:31:47'),
(99, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-08 00:31:47', '2025-12-08 00:31:47'),
(100, 1, 'categories', 'reset', NULL, NULL, 1, '2025-12-27 22:32:23', '2025-12-27 22:32:23'),
(101, 1, 'all_products', 'reset', NULL, NULL, 1, '2025-12-27 22:32:30', '2025-12-27 22:32:30'),
(102, 1, 'categories', 'created', '[\"Remeras\",\"Pantalones\",\"Buzos\",\"Shorts\",\"Puperas\",\"Puperones\",\"Minifaldas\",\"Conjuntos\",\"Musculosas\",\"Chombas\",\"Camisas\",\"Sudaderas\",\"Cinturones\",\"Tops\",\"Polleras\",\"Vestidos\",\"Sacos\",\"Blazers\",\"Camperas\",\"Blusas\",\"Chalecos\",\"Mallas\",\"Bermudas\"]', NULL, 1, '2025-12-27 22:35:48', '2025-12-27 22:35:48'),
(106, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-27 22:40:34', '2025-12-27 22:40:34'),
(107, 1, 'all_products', 'created', '[\"0004\",\"0005\",\"0006\",\"0007\",\"0008\",\"0009\",\"0010\",\"0011\",\"0013\",\"0014\",\"0015\",\"0016\",\"0018\",\"0019\",\"0020\",\"0021\",\"0022\",\"0023\",\"0024\",\"0025\",\"0026\",\"0027\",\"0028\",\"0029\",\"0030\",\"0031\",\"0032\",\"0033\",\"0034\",\"0035\",\"0036\",\"0037\",\"0038\",\"0039\",\"0040\",\"0041\",\"0042\",\"0043\",\"0044\",\"0045\",\"0046\",\"0047\",\"0048\",\"0049\",\"0050\",\"0051\",\"0052\",\"0053\",\"0054\",\"0055\",\"0056\",\"0057\",\"0058\",\"0059\",\"0060\",\"0061\",\"0062\",\"0063\",\"0064\",\"0065\",\"0066\",\"0067\",\"0068\",\"0069\",\"0070\",\"0071\",\"0072\",\"0073\",\"0074\",\"0075\",\"0076\",\"0077\",\"0078\",\"0079\",\"0080\",\"0081\",\"0082\",\"0083\",\"0084\",\"0085\",\"0086\",\"0087\",\"0088\",\"0089\",\"0090\",\"0091\",\"0092\",\"0093\",\"0094\",\"0095\",\"0096\",\"0097\",\"0098\",\"0099\",\"0100\",\"0101\",\"0102\",\"0103\",\"0104\",\"0105\"]', NULL, 1, '2025-12-27 22:41:24', '2025-12-27 22:41:24'),
(108, 1, 'all_products', 'created', '[\"0106\",\"0107\",\"0108\",\"0109\",\"0110\",\"0111\",\"0112\",\"0113\",\"0114\",\"0115\",\"0116\",\"0117\",\"0118\",\"0119\",\"0120\",\"0121\",\"0122\",\"0123\",\"0124\",\"0125\",\"0126\",\"0127\",\"0128\",\"0129\",\"0130\",\"0131\",\"0132\",\"0133\",\"0134\",\"0135\",\"0136\",\"0138\",\"0139\",\"0140\",\"0141\",\"0142\",\"0143\",\"0144\",\"0145\",\"0146\",\"0147\",\"0148\",\"0149\",\"0150\",\"0151\",\"0152\",\"0153\",\"0154\",\"0155\",\"0156\",\"0157\",\"0158\",\"0159\",\"0160\",\"0161\",\"0162\",\"0163\",\"0164\",\"0165\",\"0166\",\"0167\",\"0168\",\"0169\",\"0170\",\"0171\",\"0172\",\"0173\",\"0174\",\"0175\",\"0176\",\"0177\",\"0178\",\"0179\",\"0180\",\"0181\",\"0182\",\"0183\",\"0184\",\"0185\",\"0186\",\"0188\",\"0189\",\"0190\",\"0191\",\"0192\",\"0193\",\"0194\",\"0195\",\"0196\",\"0197\",\"0198\",\"0199\",\"0200\",\"0201\",\"0202\",\"0204\",\"0205\",\"0206\",\"0207\",\"0208\"]', NULL, 1, '2025-12-27 22:47:41', '2025-12-27 22:47:41'),
(109, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-27 22:51:13', '2025-12-27 22:51:13'),
(110, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:51:15', '2025-12-27 22:51:15'),
(111, 1, 'all_products', 'updated', '[\"0208\"]', NULL, 1, '2025-12-27 22:51:16', '2025-12-27 22:51:16'),
(112, 1, 'all_products', 'created', '[\"0209\",\"0210\",\"0211\",\"0212\",\"0213\",\"0214\",\"0215\",\"0216\",\"0217\",\"0218\",\"0219\",\"0220\",\"0221\",\"0222\",\"0223\",\"0224\",\"0225\",\"0226\",\"0227\",\"0228\",\"0229\",\"0231\",\"0232\",\"0233\",\"0234\",\"0235\",\"0236\",\"0237\",\"0238\",\"0239\",\"0240\",\"0241\",\"0242\",\"0243\",\"0244\",\"0245\",\"0246\",\"0247\",\"0248\",\"0249\",\"0250\",\"0251\",\"0252\",\"0253\",\"0254\",\"0255\",\"0256\",\"0257\",\"0258\",\"0259\",\"0260\",\"0261\",\"0262\",\"0263\",\"0264\",\"0265\",\"0266\",\"0267\",\"0268\",\"0269\",\"0270\",\"0271\",\"0272\",\"0273\",\"0274\",\"0275\",\"0276\",\"0277\",\"0278\",\"0279\",\"0280\",\"0281\",\"0282\"]', NULL, 1, '2025-12-27 22:52:09', '2025-12-27 22:52:09'),
(113, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:53:37', '2025-12-27 22:53:37'),
(114, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-27 22:55:34', '2025-12-27 22:55:34'),
(115, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:55:36', '2025-12-27 22:55:36'),
(116, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:55:36', '2025-12-27 22:55:36'),
(117, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:55:37', '2025-12-27 22:55:37'),
(118, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:55:37', '2025-12-27 22:55:37'),
(119, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-27 22:55:56', '2025-12-27 22:55:56'),
(120, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:55:58', '2025-12-27 22:55:58'),
(121, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:55:58', '2025-12-27 22:55:58'),
(122, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:55:59', '2025-12-27 22:55:59'),
(123, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:55:59', '2025-12-27 22:55:59'),
(124, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-27 22:56:01', '2025-12-27 22:56:01'),
(125, 1, 'new_products', NULL, NULL, NULL, 1, '2025-12-27 22:56:03', '2025-12-27 22:56:03'),
(126, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-27 22:56:14', '2025-12-27 22:56:14'),
(127, 1, 'new_products', NULL, NULL, NULL, 1, '2025-12-27 22:56:15', '2025-12-27 22:56:15'),
(128, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-27 22:58:13', '2025-12-27 22:58:13'),
(129, 1, 'new_products', NULL, NULL, NULL, 1, '2025-12-27 22:58:14', '2025-12-27 22:58:14'),
(130, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-27 22:58:28', '2025-12-27 22:58:28'),
(131, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:58:29', '2025-12-27 22:58:29'),
(132, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:58:30', '2025-12-27 22:58:30'),
(133, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:58:30', '2025-12-27 22:58:30'),
(134, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:58:31', '2025-12-27 22:58:31'),
(135, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-27 22:59:41', '2025-12-27 22:59:41'),
(136, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:59:42', '2025-12-27 22:59:42'),
(137, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:59:43', '2025-12-27 22:59:43'),
(138, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:59:43', '2025-12-27 22:59:43'),
(139, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:59:43', '2025-12-27 22:59:43'),
(140, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-27 22:59:52', '2025-12-27 22:59:52'),
(141, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:59:54', '2025-12-27 22:59:54'),
(142, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:59:54', '2025-12-27 22:59:54'),
(143, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:59:55', '2025-12-27 22:59:55'),
(144, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:59:55', '2025-12-27 22:59:55'),
(145, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-27 22:59:56', '2025-12-27 22:59:56'),
(146, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:59:58', '2025-12-27 22:59:58'),
(147, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:59:58', '2025-12-27 22:59:58'),
(148, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:59:59', '2025-12-27 22:59:59'),
(149, 1, 'all_products', NULL, NULL, NULL, 1, '2025-12-27 22:59:59', '2025-12-27 22:59:59'),
(150, 1, 'categories', NULL, NULL, NULL, 1, '2025-12-27 23:00:00', '2025-12-27 23:00:00'),
(151, 1, 'new_products', NULL, NULL, NULL, 1, '2025-12-27 23:00:01', '2025-12-27 23:00:01'),
(152, 1, 'categories', NULL, NULL, NULL, 1, '2026-01-03 18:55:20', '2026-01-03 18:55:20'),
(153, 1, 'new_products', NULL, NULL, NULL, 1, '2026-01-03 18:55:21', '2026-01-03 18:55:21'),
(154, 1, 'categories', NULL, NULL, NULL, 1, '2026-01-03 18:55:32', '2026-01-03 18:55:32'),
(155, 1, 'all_products', 'updated', '[\"0008\",\"0009\",\"0013\",\"0051\",\"0060\",\"0069\",\"0073\",\"0077\"]', NULL, 1, '2026-01-03 18:56:14', '2026-01-03 18:56:14'),
(156, 1, 'all_products', 'updated', '[\"0139\",\"0140\",\"0144\",\"0148\",\"0151\",\"0161\",\"0166\",\"0185\",\"0195\"]', NULL, 1, '2026-01-03 18:56:26', '2026-01-03 18:56:26'),
(157, 1, 'all_products', 'updated', '[\"0239\",\"0255\",\"0259\",\"0260\",\"0261\",\"0263\",\"0266\",\"0275\",\"0279\"]', NULL, 1, '2026-01-03 18:56:38', '2026-01-03 18:56:38'),
(158, 1, 'all_products', NULL, NULL, NULL, 1, '2026-01-03 18:56:48', '2026-01-03 18:56:48'),
(159, 1, 'categories', NULL, NULL, NULL, 1, '2026-01-03 21:54:15', '2026-01-03 21:54:15'),
(160, 1, 'new_products', NULL, NULL, NULL, 1, '2026-01-03 21:54:16', '2026-01-03 21:54:16');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `accounts_business_id_index` (`business_id`),
  ADD KEY `accounts_account_type_id_index` (`account_type_id`),
  ADD KEY `accounts_created_by_index` (`created_by`);

--
-- Indices de la tabla `account_transactions`
--
ALTER TABLE `account_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `account_transactions_account_id_index` (`account_id`),
  ADD KEY `account_transactions_transaction_id_index` (`transaction_id`),
  ADD KEY `account_transactions_transaction_payment_id_index` (`transaction_payment_id`),
  ADD KEY `account_transactions_transfer_transaction_id_index` (`transfer_transaction_id`),
  ADD KEY `account_transactions_created_by_index` (`created_by`),
  ADD KEY `account_transactions_type_index` (`type`),
  ADD KEY `account_transactions_sub_type_index` (`sub_type`),
  ADD KEY `account_transactions_operation_date_index` (`operation_date`);

--
-- Indices de la tabla `account_types`
--
ALTER TABLE `account_types`
  ADD PRIMARY KEY (`id`),
  ADD KEY `account_types_parent_account_type_id_index` (`parent_account_type_id`),
  ADD KEY `account_types_business_id_index` (`business_id`);

--
-- Indices de la tabla `activity_log`
--
ALTER TABLE `activity_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_log_log_name_index` (`log_name`);

--
-- Indices de la tabla `barcodes`
--
ALTER TABLE `barcodes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `barcodes_business_id_foreign` (`business_id`);

--
-- Indices de la tabla `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bookings_contact_id_foreign` (`contact_id`),
  ADD KEY `bookings_business_id_foreign` (`business_id`),
  ADD KEY `bookings_created_by_foreign` (`created_by`),
  ADD KEY `bookings_table_id_index` (`table_id`),
  ADD KEY `bookings_waiter_id_index` (`waiter_id`),
  ADD KEY `bookings_location_id_index` (`location_id`),
  ADD KEY `bookings_booking_status_index` (`booking_status`),
  ADD KEY `bookings_correspondent_id_index` (`correspondent_id`);

--
-- Indices de la tabla `brands`
--
ALTER TABLE `brands`
  ADD PRIMARY KEY (`id`),
  ADD KEY `brands_business_id_foreign` (`business_id`),
  ADD KEY `brands_created_by_foreign` (`created_by`);

--
-- Indices de la tabla `business`
--
ALTER TABLE `business`
  ADD PRIMARY KEY (`id`),
  ADD KEY `business_owner_id_foreign` (`owner_id`),
  ADD KEY `business_currency_id_foreign` (`currency_id`),
  ADD KEY `business_default_sales_tax_foreign` (`default_sales_tax`);

--
-- Indices de la tabla `business_locations`
--
ALTER TABLE `business_locations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `business_locations_business_id_index` (`business_id`),
  ADD KEY `business_locations_invoice_scheme_id_foreign` (`invoice_scheme_id`),
  ADD KEY `business_locations_invoice_layout_id_foreign` (`invoice_layout_id`),
  ADD KEY `business_locations_sale_invoice_layout_id_index` (`sale_invoice_layout_id`),
  ADD KEY `business_locations_selling_price_group_id_index` (`selling_price_group_id`),
  ADD KEY `business_locations_receipt_printer_type_index` (`receipt_printer_type`),
  ADD KEY `business_locations_printer_id_index` (`printer_id`);

--
-- Indices de la tabla `cash_denominations`
--
ALTER TABLE `cash_denominations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cash_denominations_model_type_model_id_index` (`model_type`,`model_id`);

--
-- Indices de la tabla `cash_registers`
--
ALTER TABLE `cash_registers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cash_registers_business_id_foreign` (`business_id`),
  ADD KEY `cash_registers_user_id_foreign` (`user_id`),
  ADD KEY `cash_registers_location_id_index` (`location_id`);

--
-- Indices de la tabla `cash_register_transactions`
--
ALTER TABLE `cash_register_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cash_register_transactions_cash_register_id_foreign` (`cash_register_id`),
  ADD KEY `cash_register_transactions_transaction_id_index` (`transaction_id`),
  ADD KEY `cash_register_transactions_type_index` (`type`),
  ADD KEY `cash_register_transactions_transaction_type_index` (`transaction_type`);

--
-- Indices de la tabla `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categories_business_id_foreign` (`business_id`),
  ADD KEY `categories_created_by_foreign` (`created_by`),
  ADD KEY `categories_parent_id_index` (`parent_id`),
  ADD KEY `categories_woocommerce_cat_id_index` (`woocommerce_cat_id`);

--
-- Indices de la tabla `categorizables`
--
ALTER TABLE `categorizables`
  ADD KEY `categorizables_categorizable_type_categorizable_id_index` (`categorizable_type`,`categorizable_id`);

--
-- Indices de la tabla `contacts`
--
ALTER TABLE `contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `contacts_business_id_foreign` (`business_id`),
  ADD KEY `contacts_created_by_foreign` (`created_by`),
  ADD KEY `contacts_type_index` (`type`),
  ADD KEY `contacts_contact_status_index` (`contact_status`),
  ADD KEY `contacts_crm_source_index` (`crm_source`),
  ADD KEY `contacts_crm_life_stage_index` (`crm_life_stage`),
  ADD KEY `contacts_converted_by_index` (`converted_by`);

--
-- Indices de la tabla `crm_call_logs`
--
ALTER TABLE `crm_call_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `crm_call_logs_business_id_index` (`business_id`),
  ADD KEY `crm_call_logs_user_id_index` (`user_id`),
  ADD KEY `crm_call_logs_contact_id_index` (`contact_id`),
  ADD KEY `crm_call_logs_created_by_index` (`created_by`);

--
-- Indices de la tabla `crm_campaigns`
--
ALTER TABLE `crm_campaigns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `crm_campaigns_business_id_foreign` (`business_id`),
  ADD KEY `crm_campaigns_created_by_index` (`created_by`);

--
-- Indices de la tabla `crm_contact_person_commissions`
--
ALTER TABLE `crm_contact_person_commissions`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `crm_lead_users`
--
ALTER TABLE `crm_lead_users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `crm_lead_users_user_id_index` (`user_id`),
  ADD KEY `crm_lead_users_contact_id_index` (`contact_id`);

--
-- Indices de la tabla `crm_marketplaces`
--
ALTER TABLE `crm_marketplaces`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `crm_proposals`
--
ALTER TABLE `crm_proposals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `crm_proposals_business_id_foreign` (`business_id`),
  ADD KEY `crm_proposals_contact_id_foreign` (`contact_id`),
  ADD KEY `crm_proposals_sent_by_index` (`sent_by`);

--
-- Indices de la tabla `crm_proposal_templates`
--
ALTER TABLE `crm_proposal_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `crm_proposal_templates_business_id_foreign` (`business_id`),
  ADD KEY `crm_proposal_templates_created_by_index` (`created_by`);

--
-- Indices de la tabla `crm_schedules`
--
ALTER TABLE `crm_schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `crm_schedules_created_by_index` (`created_by`),
  ADD KEY `crm_schedules_business_id_index` (`business_id`),
  ADD KEY `crm_schedules_contact_id_index` (`contact_id`),
  ADD KEY `crm_schedules_schedule_type_index` (`schedule_type`),
  ADD KEY `crm_schedules_notify_type_index` (`notify_type`);

--
-- Indices de la tabla `crm_schedule_logs`
--
ALTER TABLE `crm_schedule_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `crm_schedule_logs_schedule_id_foreign` (`schedule_id`),
  ADD KEY `crm_schedule_logs_created_by_index` (`created_by`);

--
-- Indices de la tabla `crm_schedule_users`
--
ALTER TABLE `crm_schedule_users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `crm_schedule_users_schedule_id_foreign` (`schedule_id`),
  ADD KEY `crm_schedule_users_user_id_index` (`user_id`);

--
-- Indices de la tabla `currencies`
--
ALTER TABLE `currencies`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `customer_groups`
--
ALTER TABLE `customer_groups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_groups_business_id_foreign` (`business_id`),
  ADD KEY `customer_groups_created_by_index` (`created_by`),
  ADD KEY `customer_groups_price_calculation_type_index` (`price_calculation_type`),
  ADD KEY `customer_groups_selling_price_group_id_index` (`selling_price_group_id`);

--
-- Indices de la tabla `dashboard_configurations`
--
ALTER TABLE `dashboard_configurations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `dashboard_configurations_business_id_foreign` (`business_id`);

--
-- Indices de la tabla `discounts`
--
ALTER TABLE `discounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `discounts_business_id_index` (`business_id`),
  ADD KEY `discounts_brand_id_index` (`brand_id`),
  ADD KEY `discounts_category_id_index` (`category_id`),
  ADD KEY `discounts_location_id_index` (`location_id`),
  ADD KEY `discounts_priority_index` (`priority`),
  ADD KEY `discounts_spg_index` (`spg`);

--
-- Indices de la tabla `discount_variations`
--
ALTER TABLE `discount_variations`
  ADD KEY `discount_variations_discount_id_index` (`discount_id`),
  ADD KEY `discount_variations_variation_id_index` (`variation_id`);

--
-- Indices de la tabla `document_and_notes`
--
ALTER TABLE `document_and_notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `document_and_notes_business_id_index` (`business_id`),
  ADD KEY `document_and_notes_notable_id_index` (`notable_id`),
  ADD KEY `document_and_notes_created_by_index` (`created_by`);

--
-- Indices de la tabla `essentials_allowances_and_deductions`
--
ALTER TABLE `essentials_allowances_and_deductions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `essentials_allowances_and_deductions_business_id_index` (`business_id`);

--
-- Indices de la tabla `essentials_attendances`
--
ALTER TABLE `essentials_attendances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `essentials_attendances_user_id_index` (`user_id`),
  ADD KEY `essentials_attendances_business_id_index` (`business_id`),
  ADD KEY `essentials_attendances_essentials_shift_id_index` (`essentials_shift_id`);

--
-- Indices de la tabla `essentials_documents`
--
ALTER TABLE `essentials_documents`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `essentials_document_shares`
--
ALTER TABLE `essentials_document_shares`
  ADD PRIMARY KEY (`id`),
  ADD KEY `essentials_document_shares_document_id_index` (`document_id`),
  ADD KEY `essentials_document_shares_value_type_index` (`value_type`);

--
-- Indices de la tabla `essentials_holidays`
--
ALTER TABLE `essentials_holidays`
  ADD PRIMARY KEY (`id`),
  ADD KEY `essentials_holidays_business_id_index` (`business_id`),
  ADD KEY `essentials_holidays_location_id_index` (`location_id`);

--
-- Indices de la tabla `essentials_kb`
--
ALTER TABLE `essentials_kb`
  ADD PRIMARY KEY (`id`),
  ADD KEY `essentials_kb_business_id_index` (`business_id`),
  ADD KEY `essentials_kb_parent_id_index` (`parent_id`),
  ADD KEY `essentials_kb_created_by_index` (`created_by`);

--
-- Indices de la tabla `essentials_kb_users`
--
ALTER TABLE `essentials_kb_users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `essentials_kb_users_kb_id_index` (`kb_id`),
  ADD KEY `essentials_kb_users_user_id_index` (`user_id`);

--
-- Indices de la tabla `essentials_leaves`
--
ALTER TABLE `essentials_leaves`
  ADD PRIMARY KEY (`id`),
  ADD KEY `essentials_leaves_essentials_leave_type_id_index` (`essentials_leave_type_id`),
  ADD KEY `essentials_leaves_business_id_index` (`business_id`),
  ADD KEY `essentials_leaves_user_id_index` (`user_id`);

--
-- Indices de la tabla `essentials_leave_types`
--
ALTER TABLE `essentials_leave_types`
  ADD PRIMARY KEY (`id`),
  ADD KEY `essentials_leave_types_business_id_index` (`business_id`);

--
-- Indices de la tabla `essentials_messages`
--
ALTER TABLE `essentials_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `essentials_messages_business_id_index` (`business_id`),
  ADD KEY `essentials_messages_user_id_index` (`user_id`),
  ADD KEY `essentials_messages_location_id_index` (`location_id`);

--
-- Indices de la tabla `essentials_payroll_groups`
--
ALTER TABLE `essentials_payroll_groups`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `essentials_payroll_group_transactions`
--
ALTER TABLE `essentials_payroll_group_transactions`
  ADD KEY `essentials_payroll_group_transactions_payroll_group_id_foreign` (`payroll_group_id`);

--
-- Indices de la tabla `essentials_reminders`
--
ALTER TABLE `essentials_reminders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `essentials_reminders_business_id_index` (`business_id`),
  ADD KEY `essentials_reminders_user_id_index` (`user_id`);

--
-- Indices de la tabla `essentials_shifts`
--
ALTER TABLE `essentials_shifts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `essentials_shifts_type_index` (`type`),
  ADD KEY `essentials_shifts_business_id_index` (`business_id`);

--
-- Indices de la tabla `essentials_todo_comments`
--
ALTER TABLE `essentials_todo_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `essentials_todo_comments_task_id_index` (`task_id`),
  ADD KEY `essentials_todo_comments_comment_by_index` (`comment_by`);

--
-- Indices de la tabla `essentials_to_dos`
--
ALTER TABLE `essentials_to_dos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `essentials_to_dos_status_index` (`status`),
  ADD KEY `essentials_to_dos_priority_index` (`priority`),
  ADD KEY `essentials_to_dos_created_by_index` (`created_by`),
  ADD KEY `essentials_to_dos_business_id_index` (`business_id`),
  ADD KEY `essentials_to_dos_task_id_index` (`task_id`);

--
-- Indices de la tabla `essentials_user_allowance_and_deductions`
--
ALTER TABLE `essentials_user_allowance_and_deductions`
  ADD KEY `essentials_user_allowance_and_deductions_user_id_index` (`user_id`),
  ADD KEY `allow_deduct_index` (`allowance_deduction_id`);

--
-- Indices de la tabla `essentials_user_sales_targets`
--
ALTER TABLE `essentials_user_sales_targets`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `essentials_user_shifts`
--
ALTER TABLE `essentials_user_shifts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `essentials_user_shifts_user_id_index` (`user_id`),
  ADD KEY `essentials_user_shifts_essentials_shift_id_index` (`essentials_shift_id`);

--
-- Indices de la tabla `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `expense_categories_business_id_foreign` (`business_id`);

--
-- Indices de la tabla `group_sub_taxes`
--
ALTER TABLE `group_sub_taxes`
  ADD KEY `group_sub_taxes_group_tax_id_foreign` (`group_tax_id`),
  ADD KEY `group_sub_taxes_tax_id_foreign` (`tax_id`);

--
-- Indices de la tabla `invoice_layouts`
--
ALTER TABLE `invoice_layouts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `invoice_layouts_business_id_foreign` (`business_id`);

--
-- Indices de la tabla `invoice_schemes`
--
ALTER TABLE `invoice_schemes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `invoice_schemes_business_id_foreign` (`business_id`),
  ADD KEY `invoice_schemes_scheme_type_index` (`scheme_type`),
  ADD KEY `invoice_schemes_number_type_index` (`number_type`);

--
-- Indices de la tabla `media`
--
ALTER TABLE `media`
  ADD PRIMARY KEY (`id`),
  ADD KEY `media_model_type_model_id_index` (`model_type`,`model_id`),
  ADD KEY `media_business_id_index` (`business_id`),
  ADD KEY `media_uploaded_by_index` (`uploaded_by`),
  ADD KEY `media_woocommerce_media_id_index` (`woocommerce_media_id`);

--
-- Indices de la tabla `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `model_has_permissions`
--
ALTER TABLE `model_has_permissions`
  ADD PRIMARY KEY (`permission_id`,`model_id`,`model_type`),
  ADD KEY `model_has_permissions_model_type_model_id_index` (`model_type`,`model_id`);

--
-- Indices de la tabla `model_has_roles`
--
ALTER TABLE `model_has_roles`
  ADD PRIMARY KEY (`role_id`,`model_id`,`model_type`),
  ADD KEY `model_has_roles_model_type_model_id_index` (`model_type`,`model_id`);

--
-- Indices de la tabla `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_notifiable_type_notifiable_id_index` (`notifiable_type`,`notifiable_id`);

--
-- Indices de la tabla `notification_templates`
--
ALTER TABLE `notification_templates`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `oauth_access_tokens`
--
ALTER TABLE `oauth_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `oauth_access_tokens_user_id_index` (`user_id`);

--
-- Indices de la tabla `oauth_auth_codes`
--
ALTER TABLE `oauth_auth_codes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `oauth_clients`
--
ALTER TABLE `oauth_clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `oauth_clients_user_id_index` (`user_id`);

--
-- Indices de la tabla `oauth_personal_access_clients`
--
ALTER TABLE `oauth_personal_access_clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `oauth_personal_access_clients_client_id_index` (`client_id`);

--
-- Indices de la tabla `oauth_refresh_tokens`
--
ALTER TABLE `oauth_refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `oauth_refresh_tokens_access_token_id_index` (`access_token_id`);

--
-- Indices de la tabla `password_resets`
--
ALTER TABLE `password_resets`
  ADD KEY `password_resets_email_index` (`email`);

--
-- Indices de la tabla `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `printers`
--
ALTER TABLE `printers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `printers_business_id_foreign` (`business_id`);

--
-- Indices de la tabla `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `products_brand_id_foreign` (`brand_id`),
  ADD KEY `products_category_id_foreign` (`category_id`),
  ADD KEY `products_sub_category_id_foreign` (`sub_category_id`),
  ADD KEY `products_tax_foreign` (`tax`),
  ADD KEY `products_name_index` (`name`),
  ADD KEY `products_business_id_index` (`business_id`),
  ADD KEY `products_unit_id_index` (`unit_id`),
  ADD KEY `products_created_by_index` (`created_by`),
  ADD KEY `products_warranty_id_index` (`warranty_id`),
  ADD KEY `products_type_index` (`type`),
  ADD KEY `products_tax_type_index` (`tax_type`),
  ADD KEY `products_barcode_type_index` (`barcode_type`),
  ADD KEY `products_secondary_unit_id_index` (`secondary_unit_id`),
  ADD KEY `products_woocommerce_product_id_index` (`woocommerce_product_id`),
  ADD KEY `products_woocommerce_media_id_index` (`woocommerce_media_id`);

--
-- Indices de la tabla `product_locations`
--
ALTER TABLE `product_locations`
  ADD KEY `product_locations_product_id_index` (`product_id`),
  ADD KEY `product_locations_location_id_index` (`location_id`);

--
-- Indices de la tabla `product_racks`
--
ALTER TABLE `product_racks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_racks_business_id_index` (`business_id`),
  ADD KEY `product_racks_location_id_index` (`location_id`),
  ADD KEY `product_racks_product_id_index` (`product_id`);

--
-- Indices de la tabla `product_variations`
--
ALTER TABLE `product_variations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_variations_name_index` (`name`),
  ADD KEY `product_variations_product_id_index` (`product_id`);

--
-- Indices de la tabla `purchase_lines`
--
ALTER TABLE `purchase_lines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_lines_transaction_id_foreign` (`transaction_id`),
  ADD KEY `purchase_lines_product_id_foreign` (`product_id`),
  ADD KEY `purchase_lines_variation_id_foreign` (`variation_id`),
  ADD KEY `purchase_lines_tax_id_foreign` (`tax_id`),
  ADD KEY `purchase_lines_sub_unit_id_index` (`sub_unit_id`),
  ADD KEY `purchase_lines_lot_number_index` (`lot_number`);

--
-- Indices de la tabla `reference_counts`
--
ALTER TABLE `reference_counts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reference_counts_business_id_index` (`business_id`);

--
-- Indices de la tabla `res_product_modifier_sets`
--
ALTER TABLE `res_product_modifier_sets`
  ADD KEY `res_product_modifier_sets_modifier_set_id_foreign` (`modifier_set_id`);

--
-- Indices de la tabla `res_tables`
--
ALTER TABLE `res_tables`
  ADD PRIMARY KEY (`id`),
  ADD KEY `res_tables_business_id_foreign` (`business_id`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `roles_business_id_foreign` (`business_id`);

--
-- Indices de la tabla `role_has_permissions`
--
ALTER TABLE `role_has_permissions`
  ADD PRIMARY KEY (`permission_id`,`role_id`),
  ADD KEY `role_has_permissions_role_id_foreign` (`role_id`);

--
-- Indices de la tabla `selling_price_groups`
--
ALTER TABLE `selling_price_groups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `selling_price_groups_business_id_foreign` (`business_id`);

--
-- Indices de la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD UNIQUE KEY `sessions_id_unique` (`id`);

--
-- Indices de la tabla `sheet_spreadsheets`
--
ALTER TABLE `sheet_spreadsheets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sheet_spreadsheets_business_id_foreign` (`business_id`),
  ADD KEY `sheet_spreadsheets_created_by_index` (`created_by`);

--
-- Indices de la tabla `sheet_spreadsheet_shares`
--
ALTER TABLE `sheet_spreadsheet_shares`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sheet_spreadsheet_shares_sheet_spreadsheet_id_foreign` (`sheet_spreadsheet_id`),
  ADD KEY `sheet_spreadsheet_shares_shared_with_index` (`shared_with`),
  ADD KEY `sheet_spreadsheet_shares_shared_id_index` (`shared_id`);

--
-- Indices de la tabla `stock_adjustment_lines`
--
ALTER TABLE `stock_adjustment_lines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_adjustment_lines_product_id_foreign` (`product_id`),
  ADD KEY `stock_adjustment_lines_variation_id_foreign` (`variation_id`),
  ADD KEY `stock_adjustment_lines_transaction_id_index` (`transaction_id`),
  ADD KEY `stock_adjustment_lines_lot_no_line_id_index` (`lot_no_line_id`);

--
-- Indices de la tabla `system`
--
ALTER TABLE `system`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `tax_rates`
--
ALTER TABLE `tax_rates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tax_rates_business_id_foreign` (`business_id`),
  ADD KEY `tax_rates_created_by_foreign` (`created_by`),
  ADD KEY `tax_rates_woocommerce_tax_rate_id_index` (`woocommerce_tax_rate_id`);

--
-- Indices de la tabla `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transactions_tax_id_foreign` (`tax_id`),
  ADD KEY `transactions_business_id_index` (`business_id`),
  ADD KEY `transactions_type_index` (`type`),
  ADD KEY `transactions_contact_id_index` (`contact_id`),
  ADD KEY `transactions_transaction_date_index` (`transaction_date`),
  ADD KEY `transactions_created_by_index` (`created_by`),
  ADD KEY `transactions_location_id_index` (`location_id`),
  ADD KEY `transactions_expense_for_foreign` (`expense_for`),
  ADD KEY `transactions_expense_category_id_index` (`expense_category_id`),
  ADD KEY `transactions_sub_type_index` (`sub_type`),
  ADD KEY `transactions_return_parent_id_index` (`return_parent_id`),
  ADD KEY `type` (`type`),
  ADD KEY `transactions_status_index` (`status`),
  ADD KEY `transactions_sub_status_index` (`sub_status`),
  ADD KEY `transactions_res_table_id_index` (`res_table_id`),
  ADD KEY `transactions_res_waiter_id_index` (`res_waiter_id`),
  ADD KEY `transactions_res_order_status_index` (`res_order_status`),
  ADD KEY `transactions_payment_status_index` (`payment_status`),
  ADD KEY `transactions_discount_type_index` (`discount_type`),
  ADD KEY `transactions_commission_agent_index` (`commission_agent`),
  ADD KEY `transactions_transfer_parent_id_index` (`transfer_parent_id`),
  ADD KEY `transactions_types_of_service_id_index` (`types_of_service_id`),
  ADD KEY `transactions_packing_charge_type_index` (`packing_charge_type`),
  ADD KEY `transactions_recur_parent_id_index` (`recur_parent_id`),
  ADD KEY `transactions_selling_price_group_id_index` (`selling_price_group_id`),
  ADD KEY `transactions_delivery_date_index` (`delivery_date`),
  ADD KEY `transactions_delivery_person_index` (`delivery_person`),
  ADD KEY `transactions_woocommerce_order_id_index` (`woocommerce_order_id`);

--
-- Indices de la tabla `transaction_payments`
--
ALTER TABLE `transaction_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transaction_payments_transaction_id_foreign` (`transaction_id`),
  ADD KEY `transaction_payments_created_by_index` (`created_by`),
  ADD KEY `transaction_payments_parent_id_index` (`parent_id`),
  ADD KEY `transaction_payments_payment_type_index` (`payment_type`);

--
-- Indices de la tabla `transaction_sell_lines`
--
ALTER TABLE `transaction_sell_lines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transaction_sell_lines_transaction_id_foreign` (`transaction_id`),
  ADD KEY `transaction_sell_lines_product_id_foreign` (`product_id`),
  ADD KEY `transaction_sell_lines_variation_id_foreign` (`variation_id`),
  ADD KEY `transaction_sell_lines_tax_id_foreign` (`tax_id`),
  ADD KEY `transaction_sell_lines_children_type_index` (`children_type`),
  ADD KEY `transaction_sell_lines_parent_sell_line_id_index` (`parent_sell_line_id`),
  ADD KEY `transaction_sell_lines_line_discount_type_index` (`line_discount_type`),
  ADD KEY `transaction_sell_lines_discount_id_index` (`discount_id`),
  ADD KEY `transaction_sell_lines_lot_no_line_id_index` (`lot_no_line_id`),
  ADD KEY `transaction_sell_lines_sub_unit_id_index` (`sub_unit_id`),
  ADD KEY `transaction_sell_lines_woocommerce_line_items_id_index` (`woocommerce_line_items_id`);

--
-- Indices de la tabla `transaction_sell_lines_purchase_lines`
--
ALTER TABLE `transaction_sell_lines_purchase_lines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sell_line_id` (`sell_line_id`),
  ADD KEY `stock_adjustment_line_id` (`stock_adjustment_line_id`),
  ADD KEY `purchase_line_id` (`purchase_line_id`);

--
-- Indices de la tabla `types_of_services`
--
ALTER TABLE `types_of_services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `types_of_services_business_id_index` (`business_id`);

--
-- Indices de la tabla `units`
--
ALTER TABLE `units`
  ADD PRIMARY KEY (`id`),
  ADD KEY `units_business_id_foreign` (`business_id`),
  ADD KEY `units_created_by_foreign` (`created_by`),
  ADD KEY `units_base_unit_id_index` (`base_unit_id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_username_unique` (`username`),
  ADD KEY `users_business_id_foreign` (`business_id`),
  ADD KEY `users_user_type_index` (`user_type`),
  ADD KEY `users_crm_contact_id_index` (`crm_contact_id`),
  ADD KEY `users_essentials_department_id_index` (`essentials_department_id`),
  ADD KEY `users_essentials_designation_id_index` (`essentials_designation_id`);

--
-- Indices de la tabla `user_contact_access`
--
ALTER TABLE `user_contact_access`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_contact_access_user_id_index` (`user_id`),
  ADD KEY `user_contact_access_contact_id_index` (`contact_id`);

--
-- Indices de la tabla `variations`
--
ALTER TABLE `variations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `variations_product_id_foreign` (`product_id`),
  ADD KEY `variations_product_variation_id_foreign` (`product_variation_id`),
  ADD KEY `variations_name_index` (`name`),
  ADD KEY `variations_sub_sku_index` (`sub_sku`),
  ADD KEY `variations_variation_value_id_index` (`variation_value_id`),
  ADD KEY `variations_woocommerce_variation_id_index` (`woocommerce_variation_id`);

--
-- Indices de la tabla `variation_group_prices`
--
ALTER TABLE `variation_group_prices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `variation_group_prices_variation_id_foreign` (`variation_id`),
  ADD KEY `variation_group_prices_price_group_id_foreign` (`price_group_id`);

--
-- Indices de la tabla `variation_location_details`
--
ALTER TABLE `variation_location_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `variation_location_details_location_id_foreign` (`location_id`),
  ADD KEY `variation_location_details_product_id_index` (`product_id`),
  ADD KEY `variation_location_details_product_variation_id_index` (`product_variation_id`),
  ADD KEY `variation_location_details_variation_id_index` (`variation_id`);

--
-- Indices de la tabla `variation_templates`
--
ALTER TABLE `variation_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `variation_templates_business_id_foreign` (`business_id`),
  ADD KEY `variation_templates_woocommerce_attr_id_index` (`woocommerce_attr_id`);

--
-- Indices de la tabla `variation_value_templates`
--
ALTER TABLE `variation_value_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `variation_value_templates_name_index` (`name`),
  ADD KEY `variation_value_templates_variation_template_id_index` (`variation_template_id`);

--
-- Indices de la tabla `warranties`
--
ALTER TABLE `warranties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `warranties_business_id_index` (`business_id`),
  ADD KEY `warranties_duration_type_index` (`duration_type`);

--
-- Indices de la tabla `woocommerce_sync_logs`
--
ALTER TABLE `woocommerce_sync_logs`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `account_transactions`
--
ALTER TABLE `account_transactions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `account_types`
--
ALTER TABLE `account_types`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `activity_log`
--
ALTER TABLE `activity_log`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=144;

--
-- AUTO_INCREMENT de la tabla `barcodes`
--
ALTER TABLE `barcodes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `brands`
--
ALTER TABLE `brands`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `business`
--
ALTER TABLE `business`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `business_locations`
--
ALTER TABLE `business_locations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `cash_denominations`
--
ALTER TABLE `cash_denominations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `cash_registers`
--
ALTER TABLE `cash_registers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `cash_register_transactions`
--
ALTER TABLE `cash_register_transactions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de la tabla `contacts`
--
ALTER TABLE `contacts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de la tabla `crm_call_logs`
--
ALTER TABLE `crm_call_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `crm_campaigns`
--
ALTER TABLE `crm_campaigns`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `crm_contact_person_commissions`
--
ALTER TABLE `crm_contact_person_commissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `crm_lead_users`
--
ALTER TABLE `crm_lead_users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `crm_marketplaces`
--
ALTER TABLE `crm_marketplaces`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `crm_proposals`
--
ALTER TABLE `crm_proposals`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `crm_proposal_templates`
--
ALTER TABLE `crm_proposal_templates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `crm_schedules`
--
ALTER TABLE `crm_schedules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `crm_schedule_logs`
--
ALTER TABLE `crm_schedule_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `crm_schedule_users`
--
ALTER TABLE `crm_schedule_users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `currencies`
--
ALTER TABLE `currencies`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=142;

--
-- AUTO_INCREMENT de la tabla `customer_groups`
--
ALTER TABLE `customer_groups`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `dashboard_configurations`
--
ALTER TABLE `dashboard_configurations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `discounts`
--
ALTER TABLE `discounts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `document_and_notes`
--
ALTER TABLE `document_and_notes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `essentials_allowances_and_deductions`
--
ALTER TABLE `essentials_allowances_and_deductions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `essentials_attendances`
--
ALTER TABLE `essentials_attendances`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `essentials_documents`
--
ALTER TABLE `essentials_documents`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `essentials_document_shares`
--
ALTER TABLE `essentials_document_shares`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `essentials_holidays`
--
ALTER TABLE `essentials_holidays`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `essentials_kb`
--
ALTER TABLE `essentials_kb`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `essentials_kb_users`
--
ALTER TABLE `essentials_kb_users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `essentials_leaves`
--
ALTER TABLE `essentials_leaves`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `essentials_leave_types`
--
ALTER TABLE `essentials_leave_types`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `essentials_messages`
--
ALTER TABLE `essentials_messages`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `essentials_payroll_groups`
--
ALTER TABLE `essentials_payroll_groups`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `essentials_reminders`
--
ALTER TABLE `essentials_reminders`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `essentials_shifts`
--
ALTER TABLE `essentials_shifts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `essentials_todo_comments`
--
ALTER TABLE `essentials_todo_comments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `essentials_to_dos`
--
ALTER TABLE `essentials_to_dos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `essentials_user_sales_targets`
--
ALTER TABLE `essentials_user_sales_targets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `essentials_user_shifts`
--
ALTER TABLE `essentials_user_shifts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `expense_categories`
--
ALTER TABLE `expense_categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `invoice_layouts`
--
ALTER TABLE `invoice_layouts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `invoice_schemes`
--
ALTER TABLE `invoice_schemes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `media`
--
ALTER TABLE `media`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=113;

--
-- AUTO_INCREMENT de la tabla `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=381;

--
-- AUTO_INCREMENT de la tabla `notification_templates`
--
ALTER TABLE `notification_templates`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `oauth_clients`
--
ALTER TABLE `oauth_clients`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `oauth_personal_access_clients`
--
ALTER TABLE `oauth_personal_access_clients`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;

--
-- AUTO_INCREMENT de la tabla `printers`
--
ALTER TABLE `printers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `products`
--
ALTER TABLE `products`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=283;

--
-- AUTO_INCREMENT de la tabla `product_racks`
--
ALTER TABLE `product_racks`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=280;

--
-- AUTO_INCREMENT de la tabla `product_variations`
--
ALTER TABLE `product_variations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=291;

--
-- AUTO_INCREMENT de la tabla `purchase_lines`
--
ALTER TABLE `purchase_lines`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=460;

--
-- AUTO_INCREMENT de la tabla `reference_counts`
--
ALTER TABLE `reference_counts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `res_tables`
--
ALTER TABLE `res_tables`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `selling_price_groups`
--
ALTER TABLE `selling_price_groups`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `sheet_spreadsheets`
--
ALTER TABLE `sheet_spreadsheets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `sheet_spreadsheet_shares`
--
ALTER TABLE `sheet_spreadsheet_shares`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `stock_adjustment_lines`
--
ALTER TABLE `stock_adjustment_lines`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `system`
--
ALTER TABLE `system`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `tax_rates`
--
ALTER TABLE `tax_rates`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT de la tabla `transaction_payments`
--
ALTER TABLE `transaction_payments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT de la tabla `transaction_sell_lines`
--
ALTER TABLE `transaction_sell_lines`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT de la tabla `transaction_sell_lines_purchase_lines`
--
ALTER TABLE `transaction_sell_lines_purchase_lines`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT de la tabla `types_of_services`
--
ALTER TABLE `types_of_services`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `units`
--
ALTER TABLE `units`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `user_contact_access`
--
ALTER TABLE `user_contact_access`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `variations`
--
ALTER TABLE `variations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=476;

--
-- AUTO_INCREMENT de la tabla `variation_group_prices`
--
ALTER TABLE `variation_group_prices`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `variation_location_details`
--
ALTER TABLE `variation_location_details`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=458;

--
-- AUTO_INCREMENT de la tabla `variation_templates`
--
ALTER TABLE `variation_templates`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `variation_value_templates`
--
ALTER TABLE `variation_value_templates`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT de la tabla `warranties`
--
ALTER TABLE `warranties`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `woocommerce_sync_logs`
--
ALTER TABLE `woocommerce_sync_logs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=161;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `barcodes`
--
ALTER TABLE `barcodes`
  ADD CONSTRAINT `barcodes_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `brands`
--
ALTER TABLE `brands`
  ADD CONSTRAINT `brands_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `brands_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `business`
--
ALTER TABLE `business`
  ADD CONSTRAINT `business_currency_id_foreign` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`),
  ADD CONSTRAINT `business_default_sales_tax_foreign` FOREIGN KEY (`default_sales_tax`) REFERENCES `tax_rates` (`id`),
  ADD CONSTRAINT `business_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `business_locations`
--
ALTER TABLE `business_locations`
  ADD CONSTRAINT `business_locations_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `business_locations_invoice_layout_id_foreign` FOREIGN KEY (`invoice_layout_id`) REFERENCES `invoice_layouts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `business_locations_invoice_scheme_id_foreign` FOREIGN KEY (`invoice_scheme_id`) REFERENCES `invoice_schemes` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `cash_registers`
--
ALTER TABLE `cash_registers`
  ADD CONSTRAINT `cash_registers_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cash_registers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `cash_register_transactions`
--
ALTER TABLE `cash_register_transactions`
  ADD CONSTRAINT `cash_register_transactions_cash_register_id_foreign` FOREIGN KEY (`cash_register_id`) REFERENCES `cash_registers` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `categories_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `contacts`
--
ALTER TABLE `contacts`
  ADD CONSTRAINT `contacts_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contacts_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `crm_campaigns`
--
ALTER TABLE `crm_campaigns`
  ADD CONSTRAINT `crm_campaigns_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `crm_lead_users`
--
ALTER TABLE `crm_lead_users`
  ADD CONSTRAINT `crm_lead_users_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `crm_proposals`
--
ALTER TABLE `crm_proposals`
  ADD CONSTRAINT `crm_proposals_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `crm_proposals_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `crm_proposal_templates`
--
ALTER TABLE `crm_proposal_templates`
  ADD CONSTRAINT `crm_proposal_templates_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `crm_schedules`
--
ALTER TABLE `crm_schedules`
  ADD CONSTRAINT `crm_schedules_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `crm_schedule_logs`
--
ALTER TABLE `crm_schedule_logs`
  ADD CONSTRAINT `crm_schedule_logs_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `crm_schedules` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `crm_schedule_users`
--
ALTER TABLE `crm_schedule_users`
  ADD CONSTRAINT `crm_schedule_users_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `crm_schedules` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `customer_groups`
--
ALTER TABLE `customer_groups`
  ADD CONSTRAINT `customer_groups_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `dashboard_configurations`
--
ALTER TABLE `dashboard_configurations`
  ADD CONSTRAINT `dashboard_configurations_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `essentials_kb`
--
ALTER TABLE `essentials_kb`
  ADD CONSTRAINT `essentials_kb_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `essentials_kb` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `essentials_payroll_group_transactions`
--
ALTER TABLE `essentials_payroll_group_transactions`
  ADD CONSTRAINT `essentials_payroll_group_transactions_payroll_group_id_foreign` FOREIGN KEY (`payroll_group_id`) REFERENCES `essentials_payroll_groups` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD CONSTRAINT `expense_categories_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `group_sub_taxes`
--
ALTER TABLE `group_sub_taxes`
  ADD CONSTRAINT `group_sub_taxes_group_tax_id_foreign` FOREIGN KEY (`group_tax_id`) REFERENCES `tax_rates` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_sub_taxes_tax_id_foreign` FOREIGN KEY (`tax_id`) REFERENCES `tax_rates` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `invoice_layouts`
--
ALTER TABLE `invoice_layouts`
  ADD CONSTRAINT `invoice_layouts_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `invoice_schemes`
--
ALTER TABLE `invoice_schemes`
  ADD CONSTRAINT `invoice_schemes_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `model_has_permissions`
--
ALTER TABLE `model_has_permissions`
  ADD CONSTRAINT `model_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `model_has_roles`
--
ALTER TABLE `model_has_roles`
  ADD CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `printers`
--
ALTER TABLE `printers`
  ADD CONSTRAINT `printers_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_brand_id_foreign` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `products_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `products_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `products_sub_category_id_foreign` FOREIGN KEY (`sub_category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `products_tax_foreign` FOREIGN KEY (`tax`) REFERENCES `tax_rates` (`id`),
  ADD CONSTRAINT `products_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `product_variations`
--
ALTER TABLE `product_variations`
  ADD CONSTRAINT `product_variations_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `purchase_lines`
--
ALTER TABLE `purchase_lines`
  ADD CONSTRAINT `purchase_lines_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_lines_tax_id_foreign` FOREIGN KEY (`tax_id`) REFERENCES `tax_rates` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_lines_transaction_id_foreign` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_lines_variation_id_foreign` FOREIGN KEY (`variation_id`) REFERENCES `variations` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `res_product_modifier_sets`
--
ALTER TABLE `res_product_modifier_sets`
  ADD CONSTRAINT `res_product_modifier_sets_modifier_set_id_foreign` FOREIGN KEY (`modifier_set_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `res_tables`
--
ALTER TABLE `res_tables`
  ADD CONSTRAINT `res_tables_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `roles`
--
ALTER TABLE `roles`
  ADD CONSTRAINT `roles_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `role_has_permissions`
--
ALTER TABLE `role_has_permissions`
  ADD CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `selling_price_groups`
--
ALTER TABLE `selling_price_groups`
  ADD CONSTRAINT `selling_price_groups_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `sheet_spreadsheets`
--
ALTER TABLE `sheet_spreadsheets`
  ADD CONSTRAINT `sheet_spreadsheets_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `sheet_spreadsheet_shares`
--
ALTER TABLE `sheet_spreadsheet_shares`
  ADD CONSTRAINT `sheet_spreadsheet_shares_sheet_spreadsheet_id_foreign` FOREIGN KEY (`sheet_spreadsheet_id`) REFERENCES `sheet_spreadsheets` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `stock_adjustment_lines`
--
ALTER TABLE `stock_adjustment_lines`
  ADD CONSTRAINT `stock_adjustment_lines_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_adjustment_lines_transaction_id_foreign` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_adjustment_lines_variation_id_foreign` FOREIGN KEY (`variation_id`) REFERENCES `variations` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tax_rates`
--
ALTER TABLE `tax_rates`
  ADD CONSTRAINT `tax_rates_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tax_rates_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transactions_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transactions_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transactions_expense_category_id_foreign` FOREIGN KEY (`expense_category_id`) REFERENCES `expense_categories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transactions_expense_for_foreign` FOREIGN KEY (`expense_for`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transactions_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `business_locations` (`id`),
  ADD CONSTRAINT `transactions_tax_id_foreign` FOREIGN KEY (`tax_id`) REFERENCES `tax_rates` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `transaction_payments`
--
ALTER TABLE `transaction_payments`
  ADD CONSTRAINT `transaction_payments_transaction_id_foreign` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `transaction_sell_lines`
--
ALTER TABLE `transaction_sell_lines`
  ADD CONSTRAINT `transaction_sell_lines_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transaction_sell_lines_tax_id_foreign` FOREIGN KEY (`tax_id`) REFERENCES `tax_rates` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transaction_sell_lines_transaction_id_foreign` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transaction_sell_lines_variation_id_foreign` FOREIGN KEY (`variation_id`) REFERENCES `variations` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `units`
--
ALTER TABLE `units`
  ADD CONSTRAINT `units_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `units_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `users_crm_contact_id_foreign` FOREIGN KEY (`crm_contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `variations`
--
ALTER TABLE `variations`
  ADD CONSTRAINT `variations_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `variations_product_variation_id_foreign` FOREIGN KEY (`product_variation_id`) REFERENCES `product_variations` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `variation_group_prices`
--
ALTER TABLE `variation_group_prices`
  ADD CONSTRAINT `variation_group_prices_price_group_id_foreign` FOREIGN KEY (`price_group_id`) REFERENCES `selling_price_groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `variation_group_prices_variation_id_foreign` FOREIGN KEY (`variation_id`) REFERENCES `variations` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `variation_location_details`
--
ALTER TABLE `variation_location_details`
  ADD CONSTRAINT `variation_location_details_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `business_locations` (`id`),
  ADD CONSTRAINT `variation_location_details_variation_id_foreign` FOREIGN KEY (`variation_id`) REFERENCES `variations` (`id`);

--
-- Filtros para la tabla `variation_templates`
--
ALTER TABLE `variation_templates`
  ADD CONSTRAINT `variation_templates_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `business` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `variation_value_templates`
--
ALTER TABLE `variation_value_templates`
  ADD CONSTRAINT `variation_value_templates_variation_template_id_foreign` FOREIGN KEY (`variation_template_id`) REFERENCES `variation_templates` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
