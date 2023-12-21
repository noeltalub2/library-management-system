-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 21, 2023 at 08:32 AM
-- Server version: 10.4.25-MariaDB
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lms-app`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `username` varchar(45) NOT NULL,
  `name` varchar(45) NOT NULL,
  `email` varchar(45) NOT NULL,
  `phonenumber` varchar(45) NOT NULL,
  `gender` varchar(45) NOT NULL,
  `password` varchar(60) NOT NULL,
  `join_date` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `attendance_id` int(11) NOT NULL,
  `user_id` varchar(15) NOT NULL,
  `time_in` varchar(15) DEFAULT NULL,
  `time_out` varchar(15) DEFAULT NULL,
  `log_date` varchar(15) NOT NULL,
  `status` varchar(2) NOT NULL,
  `logs` varchar(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `books`
--

CREATE TABLE `books` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `author` varchar(255) DEFAULT NULL,
  `publication_year` int(11) DEFAULT NULL,
  `isbn` varchar(13) DEFAULT NULL,
  `genre` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `cover_image_url` varchar(255) DEFAULT NULL,
  `copies_available` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `books`
--

INSERT INTO `books` (`id`, `title`, `author`, `publication_year`, `isbn`, `genre`, `description`, `cover_image_url`, `copies_available`, `created_at`, `updated_at`) VALUES
(1, 'Uncertainty Modeling and Analysis in Civil Engineering', 'Bilal M. Ayyub', 1997, '9780849331084', 'Educational', 'With the expansion of new technologies, materials, and the design of complex systems, the expectations of society upon engineers are becoming larger than ever. Engineers make critical decisions with potentially high adverse consequences.', '1699787482435.jpg', 5, '2023-11-12 02:40:59', '2023-11-12 03:14:28'),
(2, 'Science of Weather and Environment', 'Annette Bolger', 2010, '9789380179445', 'Educational', 'Weather is a set of all the phenomena occurring in a given atmosphere at a given time. Weather phenomena lie in the troposphere.', '1699787468622.jpg', 10, '2023-11-12 02:40:59', '2023-11-12 03:11:08'),
(3, 'Textbook Of Biochemistry For Medical Students', 'DM. Vasudevan, Sreekumari S., Kannan Vaidyanathan', 2019, '9789389034981', 'Educational', 'With this Ninth edition, the Textbook of Biochemistry for Medical Students is entering in the 24th year of existence. The Medical Council of India has accepted it as one of the standard textbooks.', '1699787446333.jpg', 10, '2023-11-12 02:40:59', '2023-11-12 03:14:50'),
(4, 'Data Structures and Algorithms Made Easy in Java', 'Narasimha Karumanchi', 2011, '9788192107554', 'Educational', 'A handy guide of sorts for any computer Science professional, data structures and algorithms made easy in Java.', '1699787203361.jpg', 10, '2023-11-12 02:40:59', '2023-11-12 03:08:19'),
(5, 'Beginner\'s Photography Guide 2nd Edition: The Ultimate Step-by-Step Manual for Getting the Most from your Digital Camera', 'DK', 2016, '9780241241271', 'Photography', 'If you\'re new to photography, then this title is suitable for you. With the ideal starting point for digital camera users, it explains key concepts in simple terms before offering visual guides to every function.', '1699787362479.jpg', 6, '2023-11-12 02:40:59', '2023-11-12 03:15:10');

-- --------------------------------------------------------

--
-- Table structure for table `faculty`
--

CREATE TABLE `faculty` (
  `id` int(11) NOT NULL,
  `facultynumber` varchar(45) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(45) NOT NULL,
  `phonenumber` varchar(45) NOT NULL,
  `gender` varchar(45) NOT NULL,
  `password` varchar(60) NOT NULL,
  `join_date` varchar(45) NOT NULL,
  `is_verified` tinyint(2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `issued_books`
--

CREATE TABLE `issued_books` (
  `id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `user_id` varchar(45) NOT NULL,
  `submitted_date` datetime NOT NULL DEFAULT current_timestamp(),
  `issue_date` datetime DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `returned_date` datetime DEFAULT NULL,
  `renewal_count` int(11) DEFAULT 0,
  `status` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `recipient_id` varchar(45) DEFAULT NULL,
  `content` varchar(200) DEFAULT NULL,
  `date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `recommendations`
--

CREATE TABLE `recommendations` (
  `id` int(11) NOT NULL,
  `book_name` varchar(45) NOT NULL,
  `author` varchar(45) NOT NULL,
  `description` varchar(100) NOT NULL,
  `user_id` varchar(45) NOT NULL,
  `date_submitted` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `student`
--

CREATE TABLE `student` (
  `id` int(11) NOT NULL,
  `studentnumber` varchar(45) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(45) NOT NULL,
  `phonenumber` varchar(11) NOT NULL,
  `course` varchar(45) NOT NULL,
  `year_section` varchar(45) NOT NULL,
  `gender` varchar(45) NOT NULL,
  `password` varchar(60) NOT NULL,
  `join_date` varchar(45) NOT NULL,
  `is_verified` tinyint(2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`attendance_id`);

--
-- Indexes for table `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `faculty`
--
ALTER TABLE `faculty`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `issued_books`
--
ALTER TABLE `issued_books`
  ADD PRIMARY KEY (`id`),
  ADD KEY `book_id` (`book_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `recipient_id` (`recipient_id`);

--
-- Indexes for table `recommendations`
--
ALTER TABLE `recommendations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_number` (`user_id`);

--
-- Indexes for table `student`
--
ALTER TABLE `student`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `studentnumber` (`studentnumber`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `books`
--
ALTER TABLE `books`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `faculty`
--
ALTER TABLE `faculty`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `issued_books`
--
ALTER TABLE `issued_books`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `recommendations`
--
ALTER TABLE `recommendations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `student`
--
ALTER TABLE `student`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `issued_books`
--
ALTER TABLE `issued_books`
  ADD CONSTRAINT `book_id` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
