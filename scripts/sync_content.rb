#!/usr/bin/env ruby

require "date"
require "fileutils"
require "optparse"
require "yaml"

module ContentSync
  SyncResult = Struct.new(:source_path, :output_path, keyword_init: true)

  module_function

  def sync_file(source_path, dest_root)
    article = read_article(source_path)
    slug = public_slug(article, source_path)
    output_path = File.join(dest_root, File.basename(source_path))
    existing_article = File.exist?(output_path) ? read_article(output_path) : nil

    FileUtils.mkdir_p(dest_root)
    File.write(output_path, public_markdown(article, source_path, slug, dest_root, existing_article))

    SyncResult.new(source_path: source_path, output_path: output_path)
  end

  def sync_directory(source_root, dest_root, include_drafts: false)
    Dir.glob(File.join(source_root, "*.md")).sort.each_with_object([]) do |source_path, results|
      article = read_article(source_path)
      next unless syncable_in_directory?(article, include_drafts: include_drafts)

      results << sync_file(source_path, dest_root)
    end
  end

  def read_article(source_path)
    text = File.read(source_path)
    match = text.match(/\A---\n(.*?)\n---\n/m)
    raise "missing frontmatter: #{source_path}" unless match

    frontmatter = YAML.safe_load(match[1], permitted_classes: [Date], aliases: false) || {}
    body = text.sub(/\A---\n.*?\n---\n/m, "")

    { "frontmatter" => frontmatter, "body" => body }
  end

  def public_markdown(article, source_path, slug, dest_root, existing_article = nil)
    frontmatter = article.fetch("frontmatter")
    body = normalize_body(article.fetch("body"), source_path, slug, dest_root)
    summary = public_summary(frontmatter, body)
    discussion = existing_article&.fetch("frontmatter", {})&.fetch("discussion", nil) || frontmatter.fetch("discussion", {})

    [
      "---",
      "title: #{frontmatter.fetch("title")}",
      "slug: #{slug}",
      "date: #{frontmatter.fetch("date")}",
      "status: ready",
      "summary: #{summary}",
      "tags: #{inline_array(frontmatter.fetch("tags", []))}",
      "origin:",
      "  private_path: #{private_path(source_path)}",
      "discussion:",
      "  issue: #{discussion_value(discussion, "issue")}",
      "  url: #{discussion_value(discussion, "url")}",
      "formats:",
      "  html: /articles/#{slug}",
      "  slides:",
      "  video:",
      "---",
      "",
      body.strip,
      "",
    ].join("\n")
  end

  def normalize_body(body, source_path, slug, dest_root)
    body
      .gsub(/!\[\[([^\]]+)\]\]/) { public_image_link(source_path, slug, dest_root, Regexp.last_match(1)) }
      .gsub(/\[\[([^\]|\n]+)\|([^\]\n]+)\]\]/, "\\2")
      .gsub(/\[\[([^\]\n]+)\]\]/, "\\1")
  end

  def public_image_link(source_path, slug, dest_root, target)
    source_asset_path = resolve_asset_path(source_path, target)
    raise "missing asset for #{target}" unless source_asset_path

    assets_root = File.expand_path("../assets", dest_root)
    filename = File.basename(target)
    output_path = File.join(assets_root, "articles", slug, filename)
    copy_public_asset(source_asset_path, output_path)

    "![#{filename}](../assets/articles/#{slug}/#{url_path(filename)})"
  end

  def resolve_asset_path(source_path, target)
    vault_root = source_path.tr("\\", "/").sub(%r{/raw/publish/.*\z}, "")
    candidates = [
      File.join(vault_root, target),
      File.join(File.dirname(source_path), target),
      File.join(vault_root, "raw", "assets", target),
      File.join(vault_root, "raw", "assets", File.basename(target)),
    ]

    candidates.find { |candidate| File.file?(candidate) }
  end

  def copy_public_asset(source_path, output_path)
    FileUtils.mkdir_p(File.dirname(output_path))

    if raster_image?(output_path)
      sanitize_raster_image(source_path, output_path)
    else
      FileUtils.cp(source_path, output_path)
    end
  end

  def sanitize_raster_image(source_path, output_path)
    sips = `which sips`.strip
    raise "sips is required to sanitize image assets" if sips.empty?

    format = File.extname(output_path).downcase == ".png" ? "png" : "jpeg"
    ok = system(sips, "-s", "format", format, source_path, "--out", output_path, out: File::NULL, err: File::NULL)
    raise "failed to sanitize image asset: #{source_path}" unless ok
  end

  def raster_image?(path)
    %w[.jpg .jpeg .png].include?(File.extname(path).downcase)
  end

  def public_slug(article, source_path)
    frontmatter = article.fetch("frontmatter")
    explicit_slug = frontmatter["slug"]
    return explicit_slug unless explicit_slug.to_s.empty?

    File.basename(source_path, ".md").sub(/\A\d{4}-\d{2}-\d{2}-/, "")
  end

  def public_summary(frontmatter, body)
    explicit_summary = frontmatter["summary"]
    return explicit_summary unless explicit_summary.to_s.empty?

    paragraph = body.lines.map(&:strip).find do |line|
      !line.empty? && !line.start_with?("#", "---", ">", "|", "```")
    end

    summary_source = paragraph || frontmatter.fetch("title")
    first_sentence = summary_source[/.*?[。！？.!?]/] || summary_source

    first_sentence.gsub(/\*\*/, "").slice(0, 120)
  end

  def private_path(source_path)
    normalized = source_path.tr("\\", "/")
    raw_publish_index = normalized.index("/raw/publish/")
    return normalized[(raw_publish_index + 1)..] if raw_publish_index

    File.join("raw", "publish", File.basename(source_path))
  end

  def syncable_in_directory?(article, include_drafts:)
    status = article.fetch("frontmatter").fetch("status", nil)
    return true if %w[ready published].include?(status)
    return true if include_drafts && status == "draft"

    false
  end

  def inline_array(values)
    "[#{Array(values).join(", ")}]"
  end

  def discussion_value(discussion, key)
    discussion && discussion[key] ? discussion[key] : nil
  end

  def url_path(value)
    value.gsub(" ", "%20")
  end
end

if $PROGRAM_NAME == __FILE__
  options = {
    source: ENV["MIND_OS_PUBLISH_SOURCE"],
    dest: File.expand_path("../content/articles", __dir__),
    include_drafts: false,
  }

  OptionParser.new do |parser|
    parser.banner = "Usage: ruby scripts/sync_content.rb [options]"
    parser.on("--source PATH", "Source file or raw/publish directory") { |value| options[:source] = value }
    parser.on("--dest PATH", "Destination content/articles directory") { |value| options[:dest] = value }
    parser.on("--include-drafts", "Include draft files when source is a directory") { options[:include_drafts] = true }
  end.parse!

  unless options[:source]
    warn "missing source: pass --source PATH or set MIND_OS_PUBLISH_SOURCE"
    exit 1
  end

  source = File.expand_path(options.fetch(:source))
  dest = File.expand_path(options.fetch(:dest))

  results =
    if File.file?(source)
      [ContentSync.sync_file(source, dest)]
    else
      ContentSync.sync_directory(source, dest, include_drafts: options.fetch(:include_drafts))
    end

  results.each do |result|
    puts "synced #{result.source_path} -> #{result.output_path}"
  end
end
